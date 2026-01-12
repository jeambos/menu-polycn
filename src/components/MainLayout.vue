<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-base-content font-sans">
    <header class="navbar bg-base-300 shadow-lg z-50 sticky top-0">
      <div class="flex-1">
        <a class="btn btn-ghost normal-case text-xl text-primary font-bold">
          <span class="text-accent mr-1">DIY</span>Relation
        </a>
      </div>
      <div class="flex-none">
        <button class="btn btn-square btn-ghost">
          🌙
        </button>
      </div>
    </header>

    <main class="flex-1 container mx-auto p-4 max-w-md">
      <slot></slot>
    </main>

    <footer class="footer items-center p-4 bg-neutral text-neutral-content">
      <div class="items-center grid-flow-col">
        <p>Copyright © 2026 - PolyCN Relationship Config</p>
      </div>
    </footer>
  </div>
</template>