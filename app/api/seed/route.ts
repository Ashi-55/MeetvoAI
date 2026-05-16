import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function createAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_KEY ?? '',
    { auth: { persistSession: false } }
  );
}


const DEMO_BUSINESS_EMAIL = 'demo-business@meetvoai.in';
const DEMO_BUILDER_EMAIL = 'demo-builder@meetvoai.in';
const DEMO_PASSWORD = 'Demo@1234';

// NOTE: This seed route is best-effort because the repo may have different table schemas.
// It attempts to create auth users and insert minimal profile rows + sample agents/conversation/deal.
export async function GET() {
  try {
    const admin = createAdmin();

    // 1) Create auth users via admin (ignore duplicates)
    const createIfMissing = async (email: string) => {
      try {
        const { data } = await admin.auth.admin.listUsers();
        const foundUser = data?.users?.find(u => u.email === email);
        if (!foundUser) throw new Error('User not found');
        return;
      } catch {
        await admin.auth.admin.createUser({
          email,
          password: DEMO_PASSWORD,
          email_confirm: true,
        });
      }
    }

    await createIfMissing(DEMO_BUSINESS_EMAIL);
    await createIfMissing(DEMO_BUILDER_EMAIL);

    const { data: businessUsers } = await admin.auth.admin.listUsers();
    const businessAuth = businessUsers?.users?.find(u => u.email === DEMO_BUSINESS_EMAIL);
    const { data: builderUsers } = await admin.auth.admin.listUsers();
    const builderAuth = builderUsers?.users?.find(u => u.email === DEMO_BUILDER_EMAIL);

    // prevent runtime errors if admin client returns unexpected shape
    if (!businessAuth?.id || !builderAuth?.id) {
      return NextResponse.json({ success: false, error: 'Seed failed to resolve demo user ids' }, { status: 500 });
    }

    const businessId = businessAuth.id;
    const builderId = builderAuth.id;

    // 2) Insert into business_profiles / builder_profiles / profiles
    // If columns differ, these inserts will be partially rejected.
    await admin.from('profiles').upsert([
      { id: businessId, email: DEMO_BUSINESS_EMAIL, full_name: 'Demo Business', name: 'Demo Business' },
      { id: builderId, email: DEMO_BUILDER_EMAIL, full_name: 'Demo Builder', name: 'Demo Builder' },
    ]);

    await admin.from('builder_profiles').upsert([
      {
        id: builderId,
        user_id: builderId,
        full_name: 'Demo Builder',
        verification_status: 'verified',
        response_time_hours: 24,
        avg_rating: 4.7,
        total_deals: 12,
      },
    ]);

    await admin.from('business_profiles').upsert([
      {
        id: businessId,
        user_id: businessId,
        business_name: 'Demo Business Co.',
        industry: 'SaaS',
        company_size: '11-50',
      },
    ]);

    // 3) Insert 4 sample agents
    const sampleAgents = [
      {
        builder_id: builderId,
        name: 'LeadCrunch Agent',
        tagline: 'Turn leads into booked calls',
        category: 'sales',
        status: 'published',
      },
      {
        builder_id: builderId,
        name: 'SupportBot Agent',
        tagline: 'Instant support replies',
        category: 'support',
        status: 'published',
      },
      {
        builder_id: builderId,
        name: 'OpsAutomation Agent',
        tagline: 'Automate repetitive workflows',
        category: 'automation',
        status: 'published',
      },
      {
        builder_id: builderId,
        name: 'MarketingSpark Agent',
        tagline: 'Personalized outreach campaigns',
        category: 'marketing',
        status: 'published',
      },
    ];

    const { data: insertedAgents } = await admin.from('agents').insert(sampleAgents).select('*');
    const agentRows = insertedAgents || [];

    // 4) Insert 1 sample conversation with messages + 1 completed deal
    const agentId = agentRows[0]?.id;

    const conversation = await admin
      .from('conversations')
      .insert({ builder_id: builderId, buyer_id: businessId, agent_id: agentId })
      .select('*')
      .single();

    const conversationId = (conversation as any).data?.id;

    // Best-effort: if conversation/messages fail due to schema mismatch, still seed the auth/profile/agents/deal.


    if (conversationId) {
      try {
        await admin.from('messages').insert([
          {
            conversation_id: conversationId,
            sender_id: businessId,
            role: 'user',
            content: 'Hi! Can your agent help us qualify leads and book calls?',
          },
          {
            conversation_id: conversationId,
            sender_id: builderId,
            role: 'assistant',
            content: 'Yes—LeadCrunch will score leads, draft outreach, and prepare calls. Want a quick demo?',
          },
        ]);
      } catch {}
    }

    // Completed deal
    const { data: dealInsert } = await admin
      .from('deals')
      .insert({
        buyer_id: businessId,
        builder_id: builderId,
        agent_id: agentId,
        offer_id: null,
        deal_value: 1000,
        status: 'completed',
      })
      .select('*');

    return NextResponse.json({
      success: true,
      message: 'Demo data seeded',
      credentials: [
        { email: DEMO_BUSINESS_EMAIL, password: DEMO_PASSWORD, role: 'business' },
        { email: DEMO_BUILDER_EMAIL, password: DEMO_PASSWORD, role: 'builder' },
      ],
      seeded: {
        businessId,
        builderId,
        conversationId: conversationId || null,
        dealId: dealInsert?.[0]?.id || null,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Seed failed' }, { status: 500 });
  }
}

