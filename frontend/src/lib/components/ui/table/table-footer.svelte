<script>
	import { cn } from "$lib/utils.js";
	let className = undefined;
	export { className as class };
</script>

<tfoot class={cn("bg-muted/50 text-primary-foreground font-medium", className)} {...$$restProps}>
	<slot />
</tfoot>
