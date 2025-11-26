import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, role, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error exporting users:', error);
      return new NextResponse('Failed to export users', { status: 500 });
    }

    const header = ['id', 'first_name', 'last_name', 'role', 'status', 'created_at'];
    const rows = users?.map((u) => [
      u.id,
      u.first_name ?? '',
      u.last_name ?? '',
      u.role ?? '',
      u.status ?? '',
      u.created_at,
    ]) || [];

    const csv = [header.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="users.csv"',
      },
    });
  } catch (error) {
    console.error('Error in users export API:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}