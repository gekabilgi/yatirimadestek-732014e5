-- Fix Function Search Path Mutable warning for match_chatbot_knowledge (version 1)
CREATE OR REPLACE FUNCTION public.match_chatbot_knowledge(query_embedding vector, p_limit integer DEFAULT 5)
 RETURNS TABLE(id uuid, question text, answer text, embedding vector, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 STABLE
 SECURITY INVOKER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    ck.id,
    ck.question,
    ck.answer,
    ck.embedding,
    ck.created_at,
    ck.updated_at
  FROM public.chatbot_knowledge ck
  WHERE ck.embedding IS NOT NULL
  ORDER BY (ck.embedding <=> query_embedding) ASC
  LIMIT p_limit;
END;
$function$;

-- Fix Function Search Path Mutable warning for match_chatbot_knowledge (version 2)
CREATE OR REPLACE FUNCTION public.match_chatbot_knowledge(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5)
 RETURNS TABLE(id uuid, question text, answer text, similarity double precision)
 LANGUAGE plpgsql
 STABLE
 SECURITY INVOKER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    chatbot_knowledge.id,
    chatbot_knowledge.question,
    chatbot_knowledge.answer,
    1 - (chatbot_knowledge.embedding <=> query_embedding) as similarity
  FROM public.chatbot_knowledge
  WHERE 1 - (chatbot_knowledge.embedding <=> query_embedding) > match_threshold
  ORDER BY chatbot_knowledge.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

-- Fix Function Search Path Mutable warning for match_knowledge_base
CREATE OR REPLACE FUNCTION public.match_knowledge_base(query_embedding vector, match_threshold double precision DEFAULT 0.7, match_count integer DEFAULT 5)
 RETURNS TABLE(id uuid, question text, answer text, similarity double precision)
 LANGUAGE plpgsql
 STABLE
 SECURITY INVOKER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    kb.id,
    kb.question,
    kb.answer,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM public.knowledge_base kb
  WHERE 1 - (kb.embedding <=> query_embedding) > match_threshold
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;