<template>
  <div
    class="relative h-screen w-screen bg-[url('/images/cover.jpg')] bg-center bg-cover flex justify-center items-center"
  >
    <div class="bg-black/30 w-full h-full absolute" />
    <div class="relative z-10">
      <slot />
    </div>
  </div>
</template>
