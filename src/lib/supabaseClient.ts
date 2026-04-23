import { createClient } from '@supabase/supabase-js';

// 프로젝트 URL은 고정입니다.
const supabaseUrl = 'https://yzbjvkifwinumytehxgf.supabase.co';
// 여기에 아까 복사한 'ey...'로 시작하는 긴 키를 따옴표 안에 넣으세요.
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6Ymp2a2lmd2ludW15dGVoeGdmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY4MzY5MDQsImV4cCI6MjA5MjQxMjkwNH0.6UOA43pgLXxRsbgeRKeTQ4bksRDPIyYnaTYWyRqUiLs'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);