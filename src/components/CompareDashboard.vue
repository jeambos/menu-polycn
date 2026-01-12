<template>
  <div class="min-h-screen flex flex-col bg-base-100 text-base-content font-sans">
    <header class="navbar bg-base-300 shadow-lg z-50 sticky top-0">
      <div class="container mx-auto px-4">
        <div class="flex-1">
          <router-link to="/" class="btn btn-ghost normal-case text-xl text-primary font-bold">
            <span class="text-accent mr-1">DIY</span>Relation
          </router-link>
        </div>
        <div class="flex-none">
          <button class="btn btn-square btn-ghost">🌙</button>
        </div>
      </div>
    </header>

    <main class="flex-1 container mx-auto p-4 w-full">
      <slot></slot>
    </main>

    <footer class="footer items-center p-4 bg-neutral text-neutral-content mt-auto">
      <div class="container mx-auto text-center">
        <p class="text-xs opacity-50">Copyright © 2026 - PolyCN Relationship Config</p>
      </div>
    </footer>
  </div>
</template>