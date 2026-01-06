import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MoodleConfig {
  api_url: string;
  api_key: string;
  university_id: string;
  lms_id: string;
}

interface MoodleUser {
  id: number;
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  fullname?: string;
  lastaccess?: number;
  suspended?: boolean;
}

interface MoodleCourse {
  id: number;
  fullname: string;
  shortname: string;
  categoryid: number;
  startdate: number;
  enddate: number;
  visible: boolean;
  enrolledusercount?: number;
}

interface MoodleGrade {
  userid: number;
  courseid: number;
  grade: number;
  maxgrade: number;
  gradedate?: number;
}

async function callMoodleApi(config: MoodleConfig, wsfunction: string, params: Record<string, any> = {}) {
  const url = new URL(config.api_url + '/webservice/rest/server.php');
  url.searchParams.set('wstoken', config.api_key);
  url.searchParams.set('moodlewsrestformat', 'json');
  url.searchParams.set('wsfunction', wsfunction);
  
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        if (typeof v === 'object') {
          Object.entries(v).forEach(([k, val]) => {
            url.searchParams.set(`${key}[${i}][${k}]`, String(val));
          });
        } else {
          url.searchParams.set(`${key}[${i}]`, String(v));
        }
      });
    } else {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString());
  const data = await response.json();
  
  if (data.exception) {
    throw new Error(`Moodle API Error: ${data.message}`);
  }
  
  return data;
}

async function syncMoodleUsers(
  supabaseClient: any,
  config: MoodleConfig,
  courseId?: number
): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  try {
    // Get enrolled users from a course, or all site users
    let users: MoodleUser[];
    
    if (courseId) {
      users = await callMoodleApi(config, 'core_enrol_get_enrolled_users', { courseid: courseId });
    } else {
      // Get all users - requires site admin token
      const usersData = await callMoodleApi(config, 'core_user_get_users', { criteria: [{ key: 'email', value: '%' }] });
      users = usersData.users || [];
    }

    for (const user of users) {
      try {
        // Check if student exists
        const { data: existingStudent } = await supabaseClient
          .from('students')
          .select('id, external_id')
          .eq('university_id', config.university_id)
          .eq('external_id', `moodle_${user.id}`)
          .single();

        const studentData = {
          name: user.fullname || `${user.firstname} ${user.lastname}`,
          email: user.email,
          external_id: `moodle_${user.id}`,
          external_source: 'moodle',
          university_id: config.university_id,
          lifecycle_stage: 'active',
          last_activity: user.lastaccess ? new Date(user.lastaccess * 1000).toISOString() : null,
          metadata: {
            moodle_id: user.id,
            moodle_username: user.username,
            suspended: user.suspended,
          }
        };

        if (existingStudent) {
          await supabaseClient
            .from('students')
            .update(studentData)
            .eq('id', existingStudent.id);
          result.updated++;
        } else {
          await supabaseClient
            .from('students')
            .insert(studentData);
          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`User ${user.email}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Failed to fetch users: ${err.message}`);
  }

  return result;
}

async function syncMoodleCourses(
  supabaseClient: any,
  config: MoodleConfig
): Promise<{ created: number; updated: number; errors: string[] }> {
  const result = { created: 0, updated: 0, errors: [] as string[] };
  
  try {
    // Get all courses
    const courses = await callMoodleApi(config, 'core_course_get_courses');

    for (const course of courses) {
      try {
        // Check if program exists
        const { data: existingProgram } = await supabaseClient
          .from('programs')
          .select('id')
          .eq('university_id', config.university_id)
          .eq('name', course.fullname)
          .single();

        const programData = {
          name: course.fullname,
          code: course.shortname,
          university_id: config.university_id,
          duration_months: course.enddate && course.startdate 
            ? Math.ceil((course.enddate - course.startdate) / (30 * 24 * 60 * 60))
            : 12,
          status: course.visible ? 'active' : 'inactive',
          metadata: {
            moodle_id: course.id,
            moodle_category: course.categoryid,
            enrolled_count: course.enrolledusercount,
          }
        };

        if (existingProgram) {
          await supabaseClient
            .from('programs')
            .update(programData)
            .eq('id', existingProgram.id);
          result.updated++;
        } else {
          await supabaseClient
            .from('programs')
            .insert(programData);
          result.created++;
        }
      } catch (err: any) {
        result.errors.push(`Course ${course.fullname}: ${err.message}`);
      }
    }
  } catch (err: any) {
    result.errors.push(`Failed to fetch courses: ${err.message}`);
  }

  return result;
}

async function syncMoodleGrades(
  supabaseClient: any,
  config: MoodleConfig,
  courseId: number
): Promise<{ processed: number; errors: string[] }> {
  const result = { processed: 0, errors: [] as string[] };
  
  try {
    // Get grades for course
    const grades = await callMoodleApi(config, 'gradereport_user_get_grades_table', { courseid: courseId });
    
    // Process grades and update engagement scores
    if (grades.tables) {
      for (const table of grades.tables) {
        const userId = table.userid;
        const totalGrade = table.tabledata?.[0]?.grade || 0;
        
        // Find student by moodle ID
        const { data: student } = await supabaseClient
          .from('students')
          .select('id, engagement_score')
          .eq('university_id', config.university_id)
          .eq('external_id', `moodle_${userId}`)
          .single();

        if (student) {
          // Calculate engagement from grade (simple mapping)
          const engagementFromGrade = Math.min(100, Math.max(0, totalGrade));
          
          await supabaseClient
            .from('students')
            .update({ 
              engagement_score: engagementFromGrade,
              metadata: { last_grade_sync: new Date().toISOString() }
            })
            .eq('id', student.id);
          
          result.processed++;
        }
      }
    }
  } catch (err: any) {
    result.errors.push(`Failed to sync grades: ${err.message}`);
  }

  return result;
}

async function testMoodleConnection(config: MoodleConfig): Promise<{ success: boolean; message: string; info?: any }> {
  try {
    // Test connection by getting site info
    const siteInfo = await callMoodleApi(config, 'core_webservice_get_site_info');
    
    return {
      success: true,
      message: `Connected to ${siteInfo.sitename}`,
      info: {
        sitename: siteInfo.sitename,
        siteurl: siteInfo.siteurl,
        username: siteInfo.username,
        fullname: siteInfo.fullname,
        version: siteInfo.version,
        release: siteInfo.release,
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message
    };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseKey);
    const body = await req.json();
    
    const { action, lms_id, university_id, api_url, api_key, course_id } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing action parameter' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Get LMS config if lms_id provided
    let config: MoodleConfig;
    
    if (lms_id) {
      const { data: lmsData, error: lmsError } = await supabaseClient
        .from('lms_integrations')
        .select('*')
        .eq('id', lms_id)
        .single();
      
      if (lmsError || !lmsData) {
        return new Response(
          JSON.stringify({ success: false, error: 'LMS integration not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      config = {
        api_url: lmsData.api_url,
        api_key: lmsData.api_key_encrypted, // Note: In production, decrypt this
        university_id: lmsData.university_id,
        lms_id: lmsData.id,
      };
    } else {
      // Use provided credentials for testing
      if (!api_url || !api_key || !university_id) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing required parameters' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
      
      config = { api_url, api_key, university_id, lms_id: '' };
    }

    let result: any;

    switch (action) {
      case 'test':
        result = await testMoodleConnection(config);
        break;
      
      case 'sync_users':
        result = await syncMoodleUsers(supabaseClient, config, course_id);
        break;
      
      case 'sync_courses':
        result = await syncMoodleCourses(supabaseClient, config);
        break;
      
      case 'sync_grades':
        if (!course_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'course_id required for grade sync' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        result = await syncMoodleGrades(supabaseClient, config, course_id);
        break;
      
      case 'full_sync':
        // Full sync: courses, then users, then grades
        const coursesResult = await syncMoodleCourses(supabaseClient, config);
        const usersResult = await syncMoodleUsers(supabaseClient, config);
        
        result = {
          courses: coursesResult,
          users: usersResult,
          success: true,
        };
        
        // Update sync status
        if (config.lms_id) {
          await supabaseClient
            .from('lms_integrations')
            .update({ 
              sync_status: 'success',
              last_sync_at: new Date().toISOString()
            })
            .eq('id', config.lms_id);
          
          // Log sync
          await supabaseClient.from('sync_logs').insert({
            university_id: config.university_id,
            lms_id: config.lms_id,
            status: 'completed',
            records_created: coursesResult.created + usersResult.created,
            records_updated: coursesResult.updated + usersResult.updated,
            records_failed: coursesResult.errors.length + usersResult.errors.length,
            error_details: { courses: coursesResult.errors, users: usersResult.errors },
            completed_at: new Date().toISOString(),
          });
        }
        break;
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Moodle sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
