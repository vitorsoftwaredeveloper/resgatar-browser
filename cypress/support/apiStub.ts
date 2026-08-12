function naoImplementado(metodo: string) {
  return () =>
    Promise.reject(
      new Error(
        `api.${metodo} foi chamada num teste de componente. Use cy.stub no service antes de montar.`,
      ),
    );
}

export const api = {
  get: naoImplementado("get"),
  post: naoImplementado("post"),
  put: naoImplementado("put"),
  patch: naoImplementado("patch"),
  delete: naoImplementado("delete"),
};

export const publicApi = {
  get: naoImplementado("get"),
  post: naoImplementado("post"),
};
