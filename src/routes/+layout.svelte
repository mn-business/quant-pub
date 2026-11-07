<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<div class="min-h-screen flex flex-col bg-[#0f1117] text-[#d1d4dc]">
  {@render children()}
</div>
