-- Add missing indexes for better query performance

-- Critical indexes (high-impact query patterns)
CREATE INDEX idx_profiles_current_workspace ON public.profiles(current_workspace_id);
CREATE INDEX idx_subscriptions_workspace_status ON public.subscriptions(workspace_id, status);
CREATE INDEX idx_library_items_workspace_created ON public.library_items(workspace_id, created_at DESC);
CREATE INDEX idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX idx_plans_superiority ON public.plans(superiority);

-- Foreign key indexes
CREATE INDEX idx_workspaces_subscription ON public.workspaces(subscription_id);
CREATE INDEX idx_subscriptions_plan ON public.subscriptions(plan_id);
CREATE INDEX idx_subscriptions_plan_snapshot ON public.subscriptions(plan_snapshot_id);
CREATE INDEX idx_orders_plan_snapshot ON public.orders(plan_snapshot_id);
CREATE INDEX idx_orders_coupon ON public.orders(coupon_id);
CREATE INDEX idx_coupons_plan ON public.coupons(plan_id);
CREATE INDEX idx_conversations_assistant ON public.conversations(assistant_id);
CREATE INDEX idx_messages_assistant ON public.messages(assistant_id);
CREATE INDEX idx_messages_user ON public.messages(user_id);
CREATE INDEX idx_messages_parent ON public.messages(parent_id);
CREATE INDEX idx_data_units_file ON public.data_units(file_id);
CREATE INDEX idx_library_items_output_file ON public.library_items(output_file_id);
CREATE INDEX idx_library_items_input_file ON public.library_items(input_file_id);
CREATE INDEX idx_library_items_voice ON public.library_items(voice_id);

-- Operational indexes (for scheduled tasks and filtering)
CREATE INDEX idx_subscriptions_renew ON public.subscriptions(renew_at) WHERE renew_at IS NOT NULL;
CREATE INDEX idx_subscriptions_reset_credits ON public.subscriptions(reset_credits_at) WHERE reset_credits_at IS NOT NULL;
CREATE INDEX idx_coupons_expires ON public.coupons(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_library_items_visibility ON public.library_items(visibility);
CREATE INDEX idx_stats_type_date ON public.stats(type, date);
