Cypress.Commands.add('login', (email, password) => {
    cy.request({
        method: 'POST',
        url: '/login',
        body: {
            email: email,
            password: password
        }
    }).then((response) => {
        // validacion de codigo 200 exitoso
        expect(response.status).to.eq(200);
        
        // guardamos el token en una variable temporal
        cy.wrap(response.body.token).as('TokenGlobal');
    });
});