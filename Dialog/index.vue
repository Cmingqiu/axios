<template>
  <section class="loading-pannel" v-show="visible">
    <img class="loading-img" src="./loading.png" alt="" srcset="" />
    <span>{{ props.text }}</span>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    text?: string;
  }>(),
  {
    text: '加载中...'
  }
);
const visible = ref(false);
const show = () => (visible.value = true);
defineExpose({ show });
</script>

<style lang="css" scoped>
/* 样式使用transform+fixed，避免relative定位 */
.loading-pannel {
  position: fixed;
  z-index: 999;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.8);
}
.loading-img {
  animation: rotate 1s linear infinite;
}
@keyframes rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
