import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Firebase 모듈 분리
          if (id.includes('firebase/app') || id.includes('firebase/auth')) {
            return 'firebase-core';
          }
          if (id.includes('firebase/database')) {
            return 'firebase-database';
          }
          if (id.includes('firebase/firestore')) {
            return 'firebase-firestore';
          }
          
          // React Router 분리
          if (id.includes('react-router-dom')) {
            return 'react-router';
          }
          
          // React 관련 모듈 분리
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          
          // 큰 페이지들을 그룹화
          if (id.includes('/pages/SettlementRoomHostPage') || 
              id.includes('/pages/SettlementMenuSelectionPage') ||
              id.includes('/pages/SettlementPaymentPage')) {
            return 'settlement-pages';
          }
          
          if (id.includes('/pages/TaxiLocationSelectionHostPage') ||
              id.includes('/pages/TaxiLocationSelectionPage') ||
              id.includes('/pages/TaxiSettlementPaymentPage')) {
            return 'taxi-pages';
          }
          
          // Naver Map 관련 분리 (구체적인 경로로 제한)
          if (id.includes('/components/map/') || 
              id.includes('NaverMap')) {
            return 'map-components';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // 청크 크기 경고 임계값 증가
    target: 'es2015', // 최신 브라우저 타겟팅으로 번들 크기 감소
    minify: 'esbuild', // esbuild 사용 (기본값, 더 빠름)
  },
})
