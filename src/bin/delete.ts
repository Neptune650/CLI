import { program } from 'commander';
import { createSupabaseClient, findSavedKey, getConfig, useLogSnag, verifyUser } from './utils';
import { definitions } from './types_supabase';
import { deleteSpecificVersion } from '../api/versions';

interface Options {
  apikey: string;
  bundle: string;
}

export const deleteApp = async (appid: string, options: Options) => {
  const { bundle } = options;
  const apikey = options.apikey || findSavedKey()
  const config = await getConfig();
  const snag = useLogSnag()

  appid = appid || config?.app?.appId
  if (!apikey) {
    program.error('Missing API key, you need to provide an API key to delete your app');
  }
  if (!appid) {
    program.error('Missing argument, you need to provide a appid, or be in a capacitor project');
  }

  const supabase = createSupabaseClient(apikey)

  const userId = await verifyUser(supabase, apikey);

  const { data: app, error: dbError0 } = await supabase
    .rpc<string>('exist_app', { appid, apikey })
  if (!app || dbError0) {
    program.error('No permission to delete')
  }

  if (bundle) {
    console.log(`Delete ${appid}@${bundle} from Capgo`);

    await deleteSpecificVersion(supabase, appid, userId, bundle);
    console.log(`${appid}@${bundle} deleted from server`)
    return
  }

  console.log(`Delete ${appid} from Capgo`);
  const { data, error: vError } = await supabase
    .from<definitions['app_versions']>('app_versions')
    .select()
    .eq('app_id', appid)
    .eq('user_id', userId)

  if (vError) {
    program.error(`App ${appid} not found in database ${vError} `)
  }

  if (data && data.length) {
    const filesToRemove = data.map(x => `${userId}/${appid}/versions/${x.bucket_id} `)
    const { error: delError } = await supabase
      .storage
      .from('apps')
      .remove(filesToRemove)
    if (delError) {
      program.error(`Cannot delete stored version for app ${appid} from storage ${delError} `)
    }
  }

  const { error: delAppVersionError } = await supabase
    .from<definitions['app_versions']>('app_versions')
    .delete()
    .eq('app_id', appid)
    .eq('user_id', userId)

  if (delAppVersionError) {
    program.error(`Cannot delete version for app ${appid} from database ${delAppVersionError} `)
  }

  const { error: dbAppError } = await supabase
    .from<definitions['apps']>('apps')
    .delete()
    .eq('app_id', appid)
    .eq('user_id', userId)

  if (dbAppError) {
    program.error(`Cannot delete from database ${dbAppError} `)
  }
  snag.publish({
    channel: 'app',
    event: 'App Deleted',
    icon: '😱',
    tags: {
      'user-id': userId,
      'app-id': appid,
    },
    notify: false,
  }).catch()
  console.log(`${appid} deleted from server`)
}
