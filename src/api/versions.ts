import { SupabaseClient } from '@supabase/supabase-js';
import { program } from 'commander';
import { definitions } from '../bin/types_supabase';
import { formatError } from '../bin/utils';
import { checkVersionNotUsedInChannel } from './channels';
import { checkVersionNotUsedInDeviceOverride } from './devices_override';
import { deleteFromStorage } from './storage';

export type AppVersion = {
  id: number;
  created_at?: string;
  app_id: string;
  name: string;
  bucket_id?: string;
  user_id: string;
  updated_at?: string;
  deleted: boolean;
  external_url?: string;
  checksum?: string;
};

export async function deleteAppVersion(supabase: SupabaseClient, appid: string, userId: string, bundle: string) {
  const { error: delAppSpecVersionError } = await supabase
    .from<definitions['app_versions']>('app_versions')
    .update({
      deleted: true
    })
    .eq('app_id', appid)
    .eq('user_id', userId)
    .eq('name', bundle);
  if (delAppSpecVersionError) {
    program.error(`App ${appid}@${bundle} not found in database '${delAppSpecVersionError}'`);
  }
}

export async function deleteSpecificVersion(supabase: SupabaseClient, appid: string, userId: string, bundle: string) {
  const versionData = await getVersionData(supabase, appid, userId, bundle);
  await checkVersionNotUsedInChannel(supabase, appid, userId, versionData, bundle);
  await checkVersionNotUsedInDeviceOverride(supabase, appid, versionData, bundle);
  // Delete only a specific version in storage
  await deleteFromStorage(supabase, userId, appid, versionData, bundle);

  await deleteAppVersion(supabase, appid, userId, bundle);
}

export async function getActiveAppVersions(supabase: SupabaseClient, appid: string, userId: string) {
  const { data, error: vError } = await supabase
    .from<definitions['app_versions']>('app_versions')
    .select()
    .eq('app_id', appid)
    .eq('user_id', userId)
    .eq('deleted', false);

  if (vError) {
    program.error(`App ${appid} not found in database ${vError} `);
  }
  return data;
}

export async function getVersionData(supabase: SupabaseClient, appid: string, userId: string, bundle: string) {
  const { data: versionData, error: versionIdError } = await supabase
    .from<definitions['app_versions']>('app_versions')
    .select()
    .eq('app_id', appid)
    .eq('user_id', userId)
    .eq('name', bundle)
    .eq('deleted', false)
    .single();
  if (!versionData || versionIdError) {
    program.error(`Version ${appid}@${bundle} doesn't exist ${formatError(versionIdError)}`);
  }
  return versionData;
}