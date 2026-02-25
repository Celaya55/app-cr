describe('API/usuarios', () => {
  it('GET Request /usuarios', () => {
      cy.request({
      url: '/usuarios',
      method: 'GET',
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      cy.log(JSON.stringify(res.body))
    })
  })
})