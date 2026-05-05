import { test, expect } from '@playwright/test';

test.describe('Suite de Registro de Usuarios', () => {

  test('TC08 - Crear usuario con credenciales válidas', async ({ page }) => {
    
    // TRUCO DE SENIOR: Generamos un email único usando la fecha y hora exacta
    // Ejemplo: medico_1713550000@hospital.com
    const emailUnico = `medico_${Date.now()}@hospital.com`;

    // 1. Navegar a la pantalla de registro de tu servidor real
    // OJO: Cambiá '/registro' por la ruta real donde esté tu formulario de crear cuenta
    await page.goto('http://195.26.254.97/register');

    // 2. Completar el formulario
    // OJO: Ajustá los placeholders ('Nombre', 'Apellido', etc.) a los que tengas en tu UI
    await page.getByPlaceholder('Ej. Dr. Juan Pérez').fill('Juan Perez');
    await page.getByPlaceholder('dr.ejemplo@hospital.com').fill(emailUnico);
    await page.getByPlaceholder('••••••••').fill('PasswordSegura123!');
    
    // Si tu formulario tiene un campo para repetir la contraseña, descomentá esta línea:
    // await page.getByPlaceholder('Repetir contraseña').fill('PasswordSegura123!');

    // 3. Enviar el formulario
    // OJO: Cambiá 'Registrarse' por el texto exacto de tu botón
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();

    // 4. Validación de Éxito
    // ¿Qué hace tu app cuando te registrás bien? ¿Te manda al login? ¿Te mete directo al dashboard?
    // Ajustá esta ruta según lo que haga tu sistema
    await expect(page).toHaveURL(/.*login/); 
    
    // Opcional: Validar que aparezca un cartel verde de éxito
    // await expect(page.getByText('Usuario creado con éxito')).toBeVisible();
  });


  test('TC09 - Crear usuario con credenciales inválidas (Passwords no ingresada)', async ({ page }) => {
    
    await page.goto('http://195.26.254.97/register');

    // Llenamos los datos pero cometemos un error intencional
    await page.getByPlaceholder('Ej. Dr. Juan Pérez').fill('Dr. Error');
    await page.getByPlaceholder('dr.ejemplo@hospital.com').fill('correo_invalido@hospital.com');    
    // ERROR INTENCIONAL: Las contraseñas no son iguales o es muy corta
    await page.getByPlaceholder('••••••••').first().fill(''); 
    
    // Si tenés campo de repetir contraseña:
    // await page.getByPlaceholder('Repetir contraseña').fill('456');

    await page.getByRole('button', { name: /Crear Cuenta/i }).click();

    // Validación de Fallo: 
    // 1. Verificamos que NO nos haya dejado avanzar de pantalla
    await expect(page).toHaveURL(/.*register/);
    
    // 2. Verificamos que aparezca algún mensaje de error en la pantalla
    // Ajustá este texto al error que muestre tu React (ej: "Las contraseñas no coinciden" o "Contraseña muy corta")
    await expect(page.getByText(/todos los campos son obligatorios/i)).toBeVisible();
  });


  test('TC10 - Crear usuario con un correo que ya existe', async ({ page }) => {
    
    // 1. Vamos a la pantalla de registro
    await page.goto('http://195.26.254.97/register');

    // 2. Llenamos el formulario con un correo que SABEMOS que ya está en tu base de datos
    await page.getByPlaceholder('Ej. Dr. Juan Pérez').fill('Juan Perez');
        
    // OJO ACÁ: Poné el correo real que usás vos para entrar a tu app o el que creamos en el TC08
    await page.getByPlaceholder('dr.ejemplo@hospital.com').fill('juanmarraimondo@gmail.com');
    
    await page.getByPlaceholder('••••••••').fill('PasswordSegura123!');;

    // 3. Intentamos registrarnos
    await page.getByRole('button', { name: /Crear Cuenta/i }).click();

    // 4. Validación de Fallo: 
    // Verificamos que no nos deje avanzar al login
    await expect(page).toHaveURL(/.*register/);
    
    // Verificamos que aparezca el mensaje de error de correo duplicado.
    // OJO: Ajustá este texto a lo que devuelva tu React (ej: "ya existe", "correo registrado", etc.)
    await expect(page.getByText(/ya existe|registrado|en uso/i)).toBeVisible();
  });
});