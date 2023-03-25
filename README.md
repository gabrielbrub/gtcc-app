### Ambiente

* [Ganache](https://trufflesuite.com/ganache/)
* [IPFS](https://docs.ipfs.tech/install/ipfs-desktop/)
* [Metamask](https://metamask.io/download/)

### Como rodar localmente
- Rode os comandos ```npm install``` e, em seguida, ```vite dev``` na raiz do projeto
  A aplicação irá subir por padrão na porta 5173.
  <br/>
  Alternativamente, rode ```npm run build``` e dê pin na pasta dist em seu nó ipfs. Você poderá então acessar a aplicação digitando o cid correspondente pelo navegador.
  
> **💡** No navegador [Brave](https://brave.com/ipfs-support/), você pode acessar um conteúdo no IPFS digitando ipfs://[CID] na barra de endereço.

- [Instale a extensão Metamask no navegador](https://metamask.io/download/)
- [Instale o Ganache e crie um workspace](https://trufflesuite.com/docs/ganache/quickstart/)
- [Instale o IPFS Desktop](https://docs.ipfs.tech/install/ipfs-desktop/) ou use o nó IPFS do Brave
- Conecte a Metamask à sua blockchain local: <br/>
Clique no ícone da extensão -> dropdown centralizado no topo com nome da rede atual -> Adicionar rede -> Add a network manually <br/>
Preencha os dados conforme a url do RPC server indicado no Ganache, e 1337 em "ID da cadeia":
<br/>
<table>
  <tr>
    <td>
      <img src="tutorial/add-network.png" alt="Alt Text 1">
    </td>
    <td>
      <img src="tutorial/mm.png" alt="Alt Text 2" style="height: 600px;">
    </td>
  </tr>
</table>



- Para publicar conteúdos usando seu nó local IPFS, você deve liberar os métodos PUT e POST nas configurações

 <img src="tutorial/ipfs-config.png" alt="Alt Text 2">

- Na aplicação, nas rotas /admin ou /deploy, clique no botão IPFS e configure o endereço apropriado para o seu nó.



### Principais dependências

* https://www.npmjs.com/package/ipfs-http-client
* https://www.npmjs.com/package/ethers

