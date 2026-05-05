import { test, expect } from '@playwright/test';

test.describe('Suite de Autenticación', () => {

  test('TC01 - Login Exitoso', async ({ page }) => {
    
    // 1. Vamos a la URL de tu Frontend
    await page.goto('http://195.26.254.97/');

    // 2. Buscamos el input del correo por su placeholder y tipeamos
    // OJO: Cambiá 'tucorreo@hospital.com' por el texto exacto que tenga tu input en la web
    await page.getByPlaceholder('dr.ejemplo@hospital.com').fill('robot_qa@hospital.com');
    
    // 3. Buscamos el input de la contraseña y tipeamos
    // OJO: Cambiá '••••••••' o 'Contraseña' por el placeholder de tu app
    await page.getByPlaceholder('••••••••').fill('Password123!'); // Usá una clave válida que tengas en tu base de datos
    
    // 4. Hacemos clic en el botón. Playwright busca un botón que contenga la palabra "Ingresar"
    // Si tu botón dice "Iniciar Sesión", cambialo acá abajo:
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();

    // 5. VALIDACIÓN: Esperamos a que la URL cambie al dashboard y aparezca algún texto único
    await expect(page).toHaveURL('http://195.26.254.97/'); 
    await expect(page.getByText('Buscar Informes')).toBeVisible();
  });

});