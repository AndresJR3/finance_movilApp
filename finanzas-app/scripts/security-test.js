const { createClient } = require('@supabase/supabase-js');

// Configuración (Hardcoded para la prueba, idealmente usar .env)
const SUPABASE_URL = 'https://jtskxssqxhvuxttsduwv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp0c2t4c3NxeGh2dXh0dHNkdXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NTM4MzQsImV4cCI6MjA3NzMyOTgzNH0.VeAJOJFbf1OakRtjwI_mACPRMn2kc4JxRwukXhmJ3Kg';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runSecurityTests() {
    console.log('🔒 Iniciando Pruebas de Seguridad...\n');

    await testEmailVerificationEnforcement();
    await testSQLInjection();
    await testXSSPayloads();
    // await testRateLimiting(); // Opcional, puede bloquear la IP
}

async function testEmailVerificationEnforcement() {
    console.log('--- Prueba 1: Verificación de Email ---');
    const email = `test_security_${Date.now()}@gmail.com`;
    const password = 'password123';

    console.log(`Registrando usuario: ${email}`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (signUpError) {
        console.error('❌ Error en registro:', signUpError.message);
        return;
    }

    console.log('Usuario registrado. Intentando iniciar sesión sin verificar email...');

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
            console.log('✅ ÉXITO: El sistema bloqueó el login (Email no confirmado).');
        } else {
            console.log(`⚠️ AVISO: Login falló pero con otro mensaje: ${signInError.message}`);
        }
    } else if (signInData.user) {
        console.log('❌ FALLO CRÍTICO: El usuario pudo iniciar sesión SIN verificar el email.');
        console.log('User ID:', signInData.user.id);
    }
    console.log('\n');
}

async function testSQLInjection() {
    console.log('--- Prueba 2: Simulación de SQL Injection ---');
    const maliciousEmail = "' OR '1'='1";
    const password = 'password123';

    console.log(`Intentando login con email: ${maliciousEmail}`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email: maliciousEmail,
        password,
    });

    if (error) {
        console.log('✅ ÉXITO: El login falló (Supabase manejó la entrada correctamente).');
        console.log('Mensaje de error:', error.message);
    } else {
        console.log('❌ FALLO: El login pareció funcionar con inyección SQL (Altamente improbable en Supabase, pero verificar).');
    }
    console.log('\n');
}

async function testXSSPayloads() {
    console.log('--- Prueba 3: Payloads XSS en Registro ---');
    const xssPayload = "<script>alert('XSS')</script>";
    // Usamos un email válido pero ponemos el payload en la metadata si es posible, o intentamos usarlo como password (aunque password no se refleja usualmente)
    // Supabase valida emails, así que poner XSS en email fallará por validación de formato, lo cual es bueno.
    // Intentaremos ponerlo en 'data' (user metadata).

    const email = `test_xss_${Date.now()}@gmail.com`;
    const password = 'password123';

    console.log(`Registrando usuario con payload XSS en metadata: ${xssPayload}`);
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: xssPayload,
            },
        },
    });

    if (error) {
        console.log('Error en registro:', error.message);
    } else {
        console.log('Usuario registrado. Verificando metadata...');
        // En un escenario real, verificaríamos si al recuperar el usuario, el cliente escapa este valor al mostrarlo.
        // Aquí solo verificamos si se guardó.
        if (data.user && data.user.user_metadata.full_name === xssPayload) {
            console.log('⚠️ AVISO: El payload se guardó tal cual en la base de datos.');
            console.log('Esto NO es una vulnerabilidad por sí mismo, pero el frontend DEBE escapar este valor al mostrarlo.');
            console.log('Valor guardado:', data.user.user_metadata.full_name);
        } else {
            console.log('✅ El payload fue sanitizado o modificado antes de guardarse.');
        }
    }
    console.log('\n');
}

runSecurityTests();
