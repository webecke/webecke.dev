import type { Env } from '../../server/env';
import { handleInvite } from '../../server/invite';

export const onRequestPost: PagesFunction<Env> = ({ request, env }) => handleInvite(request, env);
