import { test, expect } from '@playwright/test';

test.describe('Suite de Gestión de Pacientes', () => {

  // Ejecutamos el Login antes de cada prueba
  test.beforeEach(async ({ page }) => {
    await page.goto('http://195.26.254.97/');
    await page.getByPlaceholder('dr.ejemplo@hospital.com').fill('robot_qa@hospital.com');
    await page.getByPlaceholder('••••••••').fill('Password123!');
    await page.getByRole('button', { name: /Iniciar Sesión/i }).click();
    await expect(page.getByText('Informes de Pacientes')).toBeVisible();
  });

  test('Happy Path - Crear un paciente correctamente', async ({ page }) => {
    
    // 1. Navegar a la sección de Pacientes 
    // (Ajustá el nombre "Pacientes" por lo que diga el menú de tu izquierda)
    

    // 2. Clic en el botón para crear un nuevo paciente
    // (Ajustá "Nuevo Paciente" por el texto real de tu botón)
    await page.getByRole('button', { name: /Nuevo Paciente/i }).click();

    // 💡 TRUCO PRO: Generamos un DNI aleatorio para que el test no falle 
    // la segunda vez que lo corras por culpa de un "DNI duplicado".
    const dniAleatorio = `99${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Llenar el formulario (Revisá tus placeholders o labels reales)
    await page.getByPlaceholder('Nombre del paciente').fill('Paciente Automático QA');
    await page.getByPlaceholder('Apellido del paciente').fill('Paciente Automático QA');
    await page.getByPlaceholder('Ej. OSDE, Swiss Medical...').fill('Paciente Automático QA');
    await page.getByPlaceholder('DNI').fill(dniAleatorio);
   await page.locator('input[type="date"]').fill('1985-06-24');

    // 4. Guardar el paciente
    await page.getByRole('button', { name: /Crear Paciente/i }).click();

    // 5. Validación: Esperamos ver un mensaje de éxito o el nombre en la tabla
    // Si usás react-hot-toast, podés buscar parte del mensaje:
    await expect(page.getByText(/exitosamente/i).or(page.getByText('Paciente Automático QA'))).toBeVisible();
  });


  test('Sad Path - Fallo al crear paciente por campos vacíos', async ({ page }) => {
    
    await page.getByRole('button', { name: /Nuevo Paciente/i }).click();

    // 1. No llenamos NADA en el formulario y vamos directo a Guardar
    await page.getByRole('button', { name: /Crear Paciente/i }).click();

    // 2. Validación: Esperamos ver el cartel de error del frontend
    // (Revisá qué dice exactamente tu mensaje de error cuando los campos están vacíos)
    await expect(page.getByText(/Todos los campos son obligatorios/i)).toBeVisible();
  });

});