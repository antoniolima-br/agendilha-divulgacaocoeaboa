import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { validCampaignDestination } from '@/lib/intranet';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/routes/config';
export default function CampaignRedirect(){const {id}=useParams();const started=useRef(false);const [failed,setFailed]=useState(false);
useEffect(()=>{if(started.current)return;started.current=true;if(!id || !/^[0-9a-f-]{36}$/i.test(id)){setFailed(true);return;}void supabase.rpc('intranet_open_campaign',{p_id:id}).then(({data,error})=>{if(error || !data || !validCampaignDestination(data)){setFailed(true);return;}window.location.replace(data);});},[id]);
return <main className="mx-auto max-w-md p-8"><h1 className="text-2xl font-semibold">{failed?'Campanha indisponível':'Abrindo campanha…'}</h1>{failed && <><p className="py-4 text-muted-foreground">Este link não está ativo. Confira os rolês na agenda.</p><Button asChild><Link to={ROUTES.AGENDA}>Ir para a agenda</Link></Button></>}</main>;}
