<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="h-screen w-screen flex flex-col bg-[#0f1117] text-[#d1d4dc] overflow-hidden">
  {@render children()}
</div>
