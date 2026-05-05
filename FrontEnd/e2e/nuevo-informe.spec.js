import { test, expect } from '@playwright/test';

test.describe('Suite de Transcripción - Nuevo Informe', () => {

  // Permisos VIP para el micrófono (aunque subamos archivo, evita bloqueos)
  test.use({ permissions: ['microphone'] });

  test.beforeEach(async ({ page }) => {
    await page.goto('http://195.26.254.97/');

    // Login con el usuario de prueba
    await page.getByPlaceholder('dr.ejemplo@hospital.com').fill('robot_qa@hospital.com');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click(); 
    
    // El video muestra el título "Informes de Pacientes" en el Dashboard
    await expect(page.getByText('Informes de Pacientes')).toBeVisible(); 
  });

  test('TC05 - Generar Borrador interceptando la API (Mocking)', async ({ page }) => {
    
    
    await page.getByRole('button', { name: /Nuevo Dictado/i }).click();

    // 2. Interceptamos tu endpoint de Spring Boot
    await page.route('**/subir-audio', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: "65f1a2b3c4d5e6f7g8h9",
          pacienteId: "12345678",
          tipoEstudio: "Consulta General",
          transcripcion: "El paciente presenta síntomas de prueba interceptados por Playwright. No se observan anomalías.",
          estado: "BORRADOR" 
        })
      });
    });

    // 3. COMPLETAR FORMULARIO (Visto en el video)
    // Como ahora son menús desplegables (Selects), buscamos todos los combobox de la pantalla
    const selects = page.getByRole('combobox');
    
    // Seleccionamos el primer paciente disponible de la lista (índice 1, asumiendo que el 0 es "Seleccionar Paciente...")
    // OJO: Para que esto ande, tenés que tener al menos un paciente creado en tu sistema.
    await selects.nth(0).selectOption({ index: 1 }); 
    
    // Seleccionamos la opción "Consulta General" que mostraste en el video
    await selects.nth(1).selectOption('Consulta General');

    // 4. SIMULAMOS EL AUDIO
    await page.locator('input[type="file"]').setInputFiles('e2e/audio-prueba.mp3');

    // 5. CLIC EN EL BOTÓN EXACTO DEL VIDEO
    await page.getByRole('button', { name: 'Generar Borrador con IA' }).click();

    // 6. VALIDACIÓN FINAL
    await expect(page.getByText(/síntomas de prueba interceptados por Playwright/i)).toBeVisible();
  });

});