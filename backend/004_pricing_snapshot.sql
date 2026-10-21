begin;
create or replace function ms_private.clean_selection(s jsonb) returns jsonb language plpgsql set search_path='' as $$
declare p text:=s->>'package'; g text:=trim(s->>'place'); result jsonb;
begin
 if jsonb_typeof(s)<>'object' or p not in('Basic','Plus','Complete') or p is null or coalesce(length(g),0) not between 1 and 180 or octet_length(s::text)>10000 then raise exception 'Invalid request selection';end if;
 if s->>'date' is not null and s->>'date'<>'' and (s->>'date')::date<current_date then raise exception 'Preferred date must be today or later';end if;
 if jsonb_typeof(s->'additions')<>'array' or jsonb_array_length(s->'additions')>10 then raise exception 'Invalid additions';end if;
 result=jsonb_build_object('package',p,'place',g,'paath',left(coalesce(s->>'paath','No additional Paath requested'),180),'notes',left(coalesce(s->>'notes',''),1200),'additions',(select coalesce(jsonb_agg(value),'[]'::jsonb) from jsonb_array_elements_text(s->'additions') where value in('Rumala Sahib','Deg / Karah Prashad','Ardaas','Langar seva','Food / fruit distribution') or (p='Complete' and value='Live video call')),'date',case when p='Complete' then coalesce(s->>'date','') else '' end);
 if jsonb_typeof(s->'pricing_snapshot')='object' and (s->'pricing_snapshot'->>'currency')~'^[A-Z]{3}$' and (s->'pricing_snapshot'->>'currency') not in('INR','PKR','BDT') and (s->'pricing_snapshot'->>'rate')::numeric>0 then
 result=result||jsonb_build_object('pricing_snapshot',jsonb_build_object('country',left(s->'pricing_snapshot'->>'country',2),'currency',s->'pricing_snapshot'->>'currency','rate',(s->'pricing_snapshot'->>'rate')::numeric,'rateDate',left(coalesce(s->'pricing_snapshot'->>'rateDate',''),10)));
 end if;
 return result;
end$$;
commit;
