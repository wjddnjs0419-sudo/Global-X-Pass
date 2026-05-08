import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf-8');
let SERVICE_ROLE_KEY = '';
for (const line of envContent.split('\n')) {
  if (line.includes('SUPABASE_SERVICE_ROLE_KEY=')) {
    SERVICE_ROLE_KEY = line.split('SUPABASE_SERVICE_ROLE_KEY=')[1].trim();
    break;
  }
}

const SUPABASE_URL = 'https://yzbjvkifwinumytehxgf.supabase.co';

if (!SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function createBucket() {
  console.log("Checking if documents bucket exists...");
  const { data: buckets, error: getError } = await supabase.storage.listBuckets();
  
  if (getError) {
    console.error("Error listing buckets:", getError);
    return;
  }
  
  const docsBucket = buckets.find(b => b.name === 'documents');
  
  if (docsBucket) {
    console.log("documents bucket already exists. Updating properties...");
    const { error: updateError } = await supabase.storage.updateBucket('documents', {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/x-hwp'
      ]
    });
    if (updateError) console.error("Error updating bucket:", updateError);
    else console.log("Bucket updated successfully!");
  } else {
    console.log("documents bucket not found. Creating...");
    const { error: createError } = await supabase.storage.createBucket('documents', {
      public: true,
      fileSizeLimit: 10485760,
      allowedMimeTypes: [
        'application/pdf',
        'application/zip',
        'application/x-zip-compressed',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/x-hwp'
      ]
    });
    if (createError) console.error("Error creating bucket:", createError);
    else console.log("Bucket created successfully!");
  }
}

createBucket();
