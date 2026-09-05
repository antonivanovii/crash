import '@kobold/ui/styles.css';

import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './providers/AppProviders.js';
import { router } from './router/index.js';

/**
 * Точка входа. Слой app — единственный, кому разрешено знать про всё
 * остальное: он собирает провайдеры, роутер и глобальные стили.
 */
const container = document.getElementById('root');
if (!container) throw new Error('Не найден #root');

createRoot(container).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
