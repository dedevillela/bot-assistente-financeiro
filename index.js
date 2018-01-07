/**
 * Project Name: Assistente Financeiro
 * Plugin URI: https://github.com/dedevillela/bot-assistente-financeiro/
 * Description: Chatbot desenvolvido no hackaton do "BLiP Botcamp" realizado na TAKE.
 * Version: 1.0.2
 * Author: Andre Aguiar Villela, Kenner Grings, Eric Alves
 * License: MIT
 **/
let MessagingHub = require('messaginghub-client');
let WebSocketTransport = require('lime-transport-websocket');
let Lime = require('lime-js');

// inicializa a sessâo

let client = new MessagingHub.ClientBuilder()
    .withIdentifier('assistentefinanceiro')
    .withAccessKey('b2lMRWRHNUFFemFYVWQ0R1FZWDY=')
    .withTransportFactory(() => new WebSocketTransport())
    .build();

/**
* 
* Cria o bucket que armazena os dados
*
*/
client.addMessageReceiver(true, function (message) {
	try {
        var bucketName = message.from;
        if (bucketName.indexOf('/') > 0) {
        	bucketName = bucketName.substr(0,bucketName.indexOf('/')-1);
        }
		var commandAI = {
			"id": Lime.Guid(),
			"to": "postmaster@ai.msging.net",
			"method": "set",
			"uri": "/analysis",
			"type": "application/vnd.iris.ai.analysis-request+json",
			"resource": {
				"text": message.content
			}
		};
		console.log('mensagem >', message);
		client.sendCommand(comando).then(function (commandResponse) {
	        console.log("intenção>", commandResponse.resource.intentions[0]);
	        var intention = commandResponse.resource.intentions[0];
	        
	        console.log('bucketName>>', bucketName);
		    client.sendCommand({  
		        'id': Lime.Guid(),
		        'method': 'get',
		        'uri': '/buckets/' + bucketName
		    }).then(function (bucket) {
		    	console.log('Bucket>', bucket);
		    	doAction(intention, bucket.resource);

		    }).catch(function (error) {
		    	console.log("Error bucket222>", error);
		    	if (error.reason.code == 67) {
		    		console.log('Criar Bucket');
		    		var newBucket = {
		    			"saldo": 0,
		    			"transacoes": []
		    		};
		    		doAction(intention, newBucket);
		    	} else {
		    		console.log("Error bucket>", error);
		    	}
		    	
		    });
				        
	    }).catch(function (error) {
	    	console.log("Error AI>", error);
	    });

	    function doAction(intention, bucket) {
	    	var responseMessage = "";
	    	switch (intention.name) {

	    		case "consultarlancamentos":
	    			if (bucket.transacoes.length === 0) {
	    				responseMessage = {
	    				"type": "image/gif",
	    				"uri": "https://i1.wp.com/gifrific.com/wp-content/uploads/2012/08/noted-ryan-the-office.gif",
	    				"text": "Você ainda não possui lançamentos."
	    			};
	    				break;
	    			}
	    			bucket.transacoes.forEach(function(transacao){
	    				responseMessage += transacao.tipo + " - " + transacao.valor + " - " + transacao.descricao + "\n";
	    			});
	    			responseMessage += '-------------------------------- \n';
	    			responseMessage += 'Saldo R$ ' + bucket.saldo;
	    			
	    			break;

	    		case "consultarsaldo":
	    			if (bucket.transacoes.length === 0) {
	    				responseMessage = {
	    					"type": "image/gif",
	    					"uri": "https://vignette.wikia.nocookie.net/the-house-of-anubis/images/e/e8/John-cleese-no.gif/revision/latest?cb=20140213190857",
	    					"text": "Você ainda não possui lançamentos"
	    			};
	    				break;
	    			}
	    			responseMessage = {
	    				"type": "image/gif",
	    				"uri": "https://m.popkey.co/a08722/qrozb_s-200x150.gif",
	    				"text": "Seu saldo atual é R$ " + bucket.saldo
	    			};
	    			break;

	    		case "lancarreceita":
	    			var transacao = {
	    				"tipo": "Receita",
	    				"descricao": message.content
	    			};
	    			var valores = message.content.match(/\d+([.,]\d{1,2})?/);
	    			if (valores.length === 0) {
	    				responseMessage = "Não entendi o valor dessa receita. Tente novamente.";
	    				break;
	    			}
	    			try {
					console.log("Valores (lancarreceita) >", valores);
		    			transacao.valor = parseFloat(valores[0]);
	    			} catch (error) {
	    				console.log('Erro conversao valor>', error);
	    			}

	    			bucket.transacoes.push(transacao);
	    			bucket.saldo += transacao.valor;
	    			
	    			var lancarreceitagif;
					lancarreceitagif = Math.floor(Math.random()*3)+1;
					console.log('lancarreceitagif>',lancarreceitagif);

					var gifuri = lancarreceitagif;
					switch (gifuri) {
					    case 1:
					        gifuri = "https://big.assets.huffingtonpost.com/dinheiro07.gif";
					        console.log("gifuri>", gifuri);
					        responseMessage = {
					        	type: "image/gif",
						        uri: gifuri,
						        text: "Ótimo, receita lançada!"
					    	};
					        break;
					    case 2:
					        gifuri = "https://www.reactiongifs.com/r/yb.gif";
					        console.log("gifuri>", gifuri);
					        responseMessage = {
					        	type: "image/gif",
						        uri: gifuri,
						        text: "Yeah, bitch!"
					    	};
					        break;
					    case 3:
					    	gifuri = "https://i.imgur.com/O2MdBQw.gif";
					        console.log("gifuri>", gifuri);
					        responseMessage = {
					        	type: "image/gif",
						        uri: gifuri,
						        text: "Tô ryco!"
					    	};
						break;
					    default:
						gifuri = "https://i.imgur.com/O2MdBQw.gif";
					        console.log("gifuri>", gifuri);
					        responseMessage = {
					        	type: "image/gif",
						        uri: gifuri,
						        text: "Tô ryco!"
					    	};
							
					}
					console.log("gifuri>",gifuri);

	    		break;

	    		case "lancardespesa":
	    			transacao = {
	    				"tipo": "Despesa",
	    				"descricao": message.content
	    			};
	    			valores = message.content.match(/\d+([.,]\d{1,2})?/);
	    			if (valores.length === 0) {
	    				responseMessage = {
	    					type: "image/gif",
	    					uri: "https://i.warosu.org/data/lit/img/0069/15/1438497333802.gif",
	    					text: "Não entendi o valor dessa despesa. Tente novamente."
	    				};
	    				break;
	    			}
	    			try {
						console.log("Valores (lancardespesa) >", valores);
		    			transacao.valor = parseFloat(valores[0]);
	    			} catch (error) {
	    				console.log('Erro conversao valor>', error);
	    			}

	    			bucket.transacoes.push(transacao);
	    			bucket.saldo -= transacao.valor;

	    			var lancardespesagif;
					lancardespesagif = Math.floor(Math.random()*3)+1;
					console.log('lancardespesagif>',lancardespesagif);

					gifuri = lancardespesagif;
					switch (gifuri) {
					    case 1:
					        gifuri = "https://iruntheinternet.com/lulzdump/images/gifs/burning-money-dollars-table-fire-1378245820F.gif";
					        console.log("gifuri>", gifuri);
					        responseMessage = {
					        	type: "image/gif",
						        uri: gifuri,
						        text: "Ótimo, receita lançada!"
					    	};
					    break;
					    case 2:
					        gifuri = "https://i.warosu.org/data/lit/img/0069/15/1438497333802.gif";
					        console.log("gifuri>", gifuri);
					        responseMessage = {
					        	type: "image/gif",
						        uri: gifuri,
						        text: "hmmmmm..."
					    	};
					    break;
					    case 3:
					    	gifuri = "https://i.imgur.com/RsI9t.gif";
					        console.log("gifuri>", gifuri);
					        responseMessage = {
					        	type: "image/gif",
						        uri: gifuri,
						        text: "Tô tite!"
					    	};
					    break;
					    default:
						gifuri = "https://i.imgur.com/RsI9t.gif";
					        console.log("gifuri>", gifuri);
					        responseMessage = {
					        	type: "image/gif",
						        uri: gifuri,
						        text: "Tô tite!"
					    	};
					    break;
					}
					console.log('gifuri>',gifuri);

	    		break;
			default:
				console.log("intention>",transacao);
				responseMessage = "Receita";
			break;
	    	}

			console.log('Nome Bucket Criar>>', bucketName);
		    client.sendCommand({  
		        'id': Lime.Guid(),
		        'method': 'set',
		        'type': 'application/json',
		        'uri': '/buckets/' + bucketName,
		        'resource': bucket 
		    }).then(function () {
		    	console.log('Saved');
				client.sendMessage({
					id: Lime.Guid(),
					type: (typeof responseMessage == "string") ? "text/plain" : "application/vnd.lime.media-link+json",
					to: message.from,
					content: responseMessage
				});

		    }).catch(function (error) {
		    	console.log("Error set bucket>", error);
		    });
	    }
	} catch (error) {
		console.log("Erro>>", error);
	}
});

client.connect()
.then(function (session) {
    console.log('Conectado');
})
.catch(function (err) {
    console.log(err);
});
