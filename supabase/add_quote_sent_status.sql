-- =========================================================================
-- FlashDrop Express — PostgreSQL Migration: Add 'quote_sent' to order_status
-- Execute in your Supabase SQL Editor if you are using Supabase Cloud
-- =========================================================================

DO 
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum
    WHERE enumtypid = 'public.order_status'::regtype
      AND enumlabel = 'quote_sent'
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'quote_sent' BEFORE 'confirmed';
  END IF;
END ;
