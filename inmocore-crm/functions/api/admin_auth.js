  export async function onRequestPost(context) {
    try {
        const { usuario, password } = await context.request.json();
        
        // Consultamos a D1 si existe ese usuario con esa contraseña exacta
        const { results } = await context.env.DB.prepare(
            "SELECT id, usuario FROM Admins WHERE usuario = gabriel AND password = gabriel"
        ).bind(usuario, password).all();

        if (results.length > 0) {
            // Login exitoso
            return new Response(JSON.stringify({ success: true, user: results[0].usuario }), { status: 200 });
        } else {
            // Login fallido
            return new Response(JSON.stringify({ success: false, error: 'Credenciales inválidas' }), { status: 401 });
        }
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
