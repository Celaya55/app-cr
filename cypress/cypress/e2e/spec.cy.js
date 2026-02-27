describe('API/usuarios', () => {
  //variable global para almacenar el ID del usuario creado en el test de POST y 
  // usarlo en el test de DELETE
  let idUsuarioCreado;
  beforeEach(() => {
    // 1. Llamamos a nuestro comando personalizado con un solo renglón de código
    cy.login('prueba', 'prueba123');
  });
  it('GET Request /usuarios', () => {
    cy.get('@TokenGlobal').then((tokenSeguro) => {
      cy.request({
        url: '/usuarios',
        method: 'GET',
        headers: {
          // Así se manda exactamente como lo espera tu backend
          'Authorization': `Bearer ${tokenSeguro}`
        }
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');
        cy.log(JSON.stringify(res.body))
      })
    })
  })

  it('POST Request /usuarios', () => {
    cy.get('@TokenGlobal').then((tokenSeguro) => {
      // variable para hacer correos diferentes cada vez que se ejecute el test
      const correoDinamico = `juan_${Date.now()}@ejemplo.com`;
      cy.request({
        url: '/usuarios',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenSeguro}`
        },
        body: {
          email: correoDinamico,
          password: 'contraseña123'
        }
      }).then((res) => {
        expect(res.status).to.eq(201);
        cy.log(JSON.stringify(res.body))
        // 2. ATRAPAMOS EL ID: Guardamos el ID que nos respondió la base de datos
        idUsuarioCreado = res.body.id;
        cy.wrap(res.body.id).as('idUsuarioCreado');
        cy.log(`El backend nos devolvió el ID autoincremental: ${idUsuarioCreado}`);
      })
    })
  })
  it('Delete Request /usuarios ', () => {
    cy.get('@TokenGlobal').then((tokenSeguro) => {
    
        cy.request({
          url: `/usuarios/${idUsuarioCreado}`,
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${tokenSeguro}`
          }
        }).then((res) => {
          expect(res.status).to.eq(200);
          cy.log(`usuario con id ${idUsuarioCreado} eliminado exitosamente`);
        })
      
    })
  })


})