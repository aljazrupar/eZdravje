
var baseUrl = 'https://rest.ehrscape.com/rest/v1';
var queryUrl = baseUrl + '/query';

var username = "ois.seminar";
var password = "ois4fri";


/**
 * Prijava v sistem z privzetim uporabnikom za predmet OIS in pridobitev
 * enolične ID številke za dostop do funkcionalnosti
 * @return enolični identifikator seje za dostop do funkcionalnosti
 */
function getSessionId() {
    var response = $.ajax({
        type: "POST",
        url: baseUrl + "/session?username=" + encodeURIComponent(username) +
                "&password=" + encodeURIComponent(password),
        async: false
    });
    return response.responseJSON.sessionId;
}


/**
 * Kreiraj nov EHR zapis za pacienta in dodaj osnovne demografske podatke.
 * V primeru uspešne akcije izpiši sporočilo s pridobljenim EHR ID, sicer
 * izpiši napako.
 */
 

function kreirajEHRzaBolnika(ime,priimek,datumRojstva,stPacienta) { // ___________________________________________________________________________DODANO
	
	sessionId = getSessionId();

	
	if (!ime || !priimek || !datumRojstva || ime.trim().length == 0 ||
      priimek.trim().length == 0 || datumRojstva.trim().length == 0) {
		$("#kreirajSporocilo").html("<span class='obvestilo label " +
      "label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		$.ajax({
		    url: baseUrl + "/ehr",
		    type: 'POST',
		    success: function (data) {
		        var ehrId = data.ehrId;
		        var partyData = {
		            firstNames: ime,
		            lastNames: priimek,
		            dateOfBirth: datumRojstva,
		            partyAdditionalInfo: [{key: "ehrId", value: ehrId}]  // tale ehrId bo treba nekak prenest dol_________________________ NEVEM kako???
		            
		        };
		        
		        $.ajax({
		            url: baseUrl + "/demographics/party",
		            type: 'POST',
		            contentType: 'application/json',
		            data: JSON.stringify(partyData),
		            success: function (party) {
		                if (party.action == 'CREATE') {
		                    $("#kreirajSporocilo").html("<span class='obvestilo " +
                          "label label-success fade-in'>Uspešno kreiran EHR '" +
                          ehrId + "'.</span>");
		                    $("#preberiEHRid").val(ehrId);
		                }
		            },
		            error: function(err) {
		            	$("#kreirajSporocilo").html("<span class='obvestilo label " +
                    "label-danger fade-in'>Napaka '" +
                    JSON.parse(err.responseText).userMessage + "'!");
		            }
		        });
		        
		        zgenerirajPodatkeZaEHR(ehrId,stPacienta);
		    }
		});
	}
	
	
	
	
}


/**
 * Za podan EHR ID preberi demografske podrobnosti pacienta in izpiši sporočilo
 * s pridobljenimi podatki (ime, priimek in datum rojstva).
 */
function preberiEHRodBolnika() {
	sessionId = getSessionId();

	var ehrId = $("#preberiEHRid").val();

	if (!ehrId || ehrId.trim().length == 0) {
		$("#preberiSporocilo").html("<span class='obvestilo label label-warning " +
      "fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
			type: 'GET',
			headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-success fade-in'>Bolnik '" + party.firstNames + " " +
          party.lastNames + "', ki se je rodil '" + party.dateOfBirth +
          "'.</span>");
			},
			error: function(err) {
				$("#preberiSporocilo").html("<span class='obvestilo label " +
          "label-danger fade-in'>Napaka '" +
          JSON.parse(err.responseText).userMessage + "'!");
			}
		});
	}
}


/**
 * Za dodajanje vitalnih znakov pacienta je pripravljena kompozicija, ki
 * vključuje množico meritev vitalnih znakov (EHR ID, datum in ura,
 * telesna višina, telesna teža, sistolični in diastolični krvni tlak,
 * nasičenost krvi s kisikom in merilec).
 */
function dodajMeritveVitalnihZnakov(ehrId,datumInUra,telesnaVisina,telesnaTeza,telesnaTemperatura,sistolicniKrvniTlak,diastolicniKrvniTlak,nasicenostKrviSKisikom) {
	//console.log(ehrId + " " + datumInUra+ " " + telesnaVisina+ " " + telesnaTeza+ " " + telesnaTemperatura+ " " + sistolicniKrvniTlak+ " " + diastolicniKrvniTlak+ " " + nasicenostKrviSKisikom)
	sessionId = getSessionId();
	
	/*
	var ehrId = $("#dodajVitalnoEHR").val();
	var datumInUra = $("#dodajVitalnoDatumInUra").val();
	var telesnaVisina = $("#dodajVitalnoTelesnaVisina").val();
	var telesnaTeza = $("#dodajVitalnoTelesnaTeza").val();
	var telesnaTemperatura = $("#dodajVitalnoTelesnaTemperatura").val();
	var sistolicniKrvniTlak = $("#dodajVitalnoKrvniTlakSistolicni").val();
	var diastolicniKrvniTlak = $("#dodajVitalnoKrvniTlakDiastolicni").val();
	var nasicenostKrviSKisikom = $("#dodajVitalnoNasicenostKrviSKisikom").val();
	*/
	
	if (!ehrId || ehrId.trim().length == 0) {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevane podatke!</span>");
	} else {
		$.ajaxSetup({
		    headers: {"Ehr-Session": sessionId}
		});
		var podatki = {
			// Struktura predloge je na voljo na naslednjem spletnem naslovu:
      // https://rest.ehrscape.com/rest/v1/template/Vital%20Signs/example
		    "ctx/language": "en",
		    "ctx/territory": "SI",
		    "ctx/time": datumInUra,
		    "vital_signs/height_length/any_event/body_height_length": telesnaVisina,
		    "vital_signs/body_weight/any_event/body_weight": telesnaTeza,
		   	"vital_signs/body_temperature/any_event/temperature|magnitude": telesnaTemperatura,
		    "vital_signs/body_temperature/any_event/temperature|unit": "°C",
		    "vital_signs/blood_pressure/any_event/systolic": sistolicniKrvniTlak,
		    "vital_signs/blood_pressure/any_event/diastolic": diastolicniKrvniTlak,
		    "vital_signs/indirect_oximetry:0/spo2|numerator": nasicenostKrviSKisikom
		};
		var parametriZahteve = {
		    ehrId: ehrId,
		    templateId: 'Vital Signs',
		    format: 'FLAT'
		};
		$.ajax({
		    url: baseUrl + "/composition?" + $.param(parametriZahteve),
		    type: 'POST',
		    contentType: 'application/json',
		    data: JSON.stringify(podatki),
		    success: function (res) {
		        $("#dodajMeritveVitalnihZnakovSporocilo").html(
              "<span class='obvestilo label label-success fade-in'>" +
              res.meta.href + ".</span>");
		    },
		    error: function(err) {
		    	$("#dodajMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
		    }
		});
	}
}


/**
 * Pridobivanje vseh zgodovinskih podatkov meritev izbranih vitalnih znakov
 * (telesna temperatura, filtriranje telesne temperature in telesna teža).
 * Filtriranje telesne temperature je izvedena z AQL poizvedbo, ki se uporablja
 * za napredno iskanje po zdravstvenih podatkih.
 */
function preberiMeritveTlaka(){
	sessionId = getSessionId();
	
	var ehrId = $("#meritveTlakaEHRid").val();
	var tip = $("#preberiTlak").val();
	var stVpisov = $("#preberiSteviloIzpisov").val();
	
	stVpisov = parseInt(stVpisov);
	
	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	}
	else{
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveTlaka").html("<br/><span>Pridobivanje " +
          "podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</span><br/><br/>");
          	
          	
          		if(tip == "sistolicni krvni tlak"){
          			
          			
          			
          			$.ajax({
          				
  					    url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure" + "?limit="+ stVpisov,
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Tlak</th></tr>";
                    			var sestevekTlakSistolicni = 0;
                    			
						        for (var i in res) {
						        	
						        	sestevekTlakSistolicni += res[i].systolic;
						        	
						        	
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].systolic +
                          " " + "</td>";
						        }
						        
						        var povprecniTlakSistolicni = sestevekTlakSistolicni / res.length;
						        
						        results += "</table>";
						        
						        results += "<font size='4'>" + "<p><span style='color:blue;font-weight:bold'>Vas povprecni sistolicni krvni tlak je: </span></p>" +  povprecniTlakSistolicni;
						        
						      
						        results += "<p><span style='color:blue;font-weight:bold'>Naš nasvet: </span></p>"
						          
						        if(povprecniTlakSistolicni < 80){
						        	results += "<p> <span> Imate zelo nizek sistolivcni krvni tlak. Svetujem vam obisk zdravnika. Simptomi kot so zaspanost in brez energije so običajni za ta problem. </span></p>"
						        }
						        else if(povprecniTlakSistolicni >80 && povprecniTlakSistolicni <= 120){
						        	results += "<p><span> Imate idealen sistolicni krvni tlak. Ni vam potrebno biti zaskrbljen. </span> </p>"
						        }
						        else if(povprecniTlakSistolicni > 120 && povprecniTlakSistolicni <= 140){
						        	results += "<p> <span> <p>Imate še normalni sistolicni krvni tlak. Izogibajte se pozivilom, kot so kava in podobni napitki. </span></p>"
						        }
						        else if(povprecniTlakSistolicni > 140 && povprecniTlakSistolicni <= 160){
						        	results += "<p> <span> Hipertenzija I. stopnje : Imate zelo povišan krvni tlak. Svetujemo takojšnji obisk zdravnika. </span></p>"
						        }
						        else if(povprecniTlakSistolicni > 160 && povprecniTlakSistolicni <= 180){
						        	results += "<p> <span> Hipertenzija II. stopnje : Imate zelo povišan krvni tlak. Svetujemo takojšnji obisk zdravnika. </span></p>"
						        }
						        else if(povprecniTlakSistolicni > 180){
						        	results += "<p> <span> Hipertenzija III. stopnje : Imate zelo povišan krvni tlak. Svetujemo takojšnji obisk zdravnika. </span></p>"
						        }
						        console.log(results);
						        // results += "<iframe src='https://www.youtube.com/watch?v=Ab9OZsDECZw' style='width:200px; height:150px; allowfullscreen'></iframe>";
						       	// results += "<a class='twitter-timeline' data-widget-id='600720083413962752' href='https://twitter.com/TwitterDev' data-tweet-limit='3'> Tweets by @TwitterDev </a>"
						        $("#rezultatMeritveTlaka").append(results);
						        
					    	} else {
					    		$("#preberiMeritveTlakaSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveTlakaSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
					
					
          		}
        
          		
          		else if(tip == "diastolicni krvni tlak"){
          			
          			// TODO!------------------------------------------------------------------------------------------------
          			$.ajax({
          				
  					    url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure" + "?limit="+ stVpisov,
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Tlak</th></tr>";
                    			var sestevekTlakDiastolicni = 0;
                    			
						        for (var i in res) {
						        	
						        	sestevekTlakDiastolicni += res[i].diastolic;
						        	
						        	
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].diastolic +
                          " " + "</td>";
						        }
						        
						        var povprecniTlakDiastolicni= sestevekTlakDiastolicni / res.length;
						        
						        results += "</table>";
						        
						        results += "<font size='4'>" + "<p><span style='color:blue;font-weight:bold'>Vas povprecni diastolicni krvni tlak je: </span></p>" +  povprecniTlakDiastolicni;
						        
						        
						        $("#rezultatMeritveTlaka").append(results);
						        
					    	} else {
					    		$("#preberiMeritveTlakaSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveTlakaSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
					
					
					
          		}
	    	}
	    	});
	}
	
			
	
	
}
function preberiMeritveVitalnihZnakov() {
	sessionId = getSessionId();

	var ehrId = $("#meritveVitalnihZnakovEHRid").val();
	var tip = $("#preberiTipZaVitalneZnake").val();

	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	} else {
		
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveVitalnihZnakov").html("<br/><span>Pridobivanje " +
          "podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</span><br/><br/>");
          
				if (tip == "telesna temperatura") {
					$.ajax({
  					    url: baseUrl + "/view/" + ehrId + "/" + "body_temperature",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna temperatura</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].temperature +
                          " " + res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna teža") {
					$.ajax({
					    url: baseUrl + "/view/" + ehrId + "/" + "weight",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Telesna teža</th></tr>";
						        for (var i in res) {
						            results += "<tr><td>" + res[i].time +
                          "</td><td class='text-right'>" + res[i].weight + " " 	+
                          res[i].unit + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				} else if (tip == "telesna temperatura AQL") {
					var AQL =
						"select " +
    						"t/data[at0002]/events[at0003]/time/value as cas, " +
    						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude as temperatura_vrednost, " +
    						"t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/units as temperatura_enota " +
						"from EHR e[e/ehr_id/value='" + ehrId + "'] " +
						"contains OBSERVATION t[openEHR-EHR-OBSERVATION.body_temperature.v1] " +
						"where t/data[at0002]/events[at0003]/data[at0001]/items[at0004]/value/magnitude<35 " +
						"order by t/data[at0002]/events[at0003]/time/value desc " +
						"limit 10";
					$.ajax({
					    url: baseUrl + "/query?" + $.param({"aql": AQL}),
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	var results = "<table class='table table-hover'>" +
                  "<tr><th>Datum in ura</th><th class='text-right'>" +
                  "Telesna temperatura</th></tr>";
					    	if (res) {
					    		var rows = res.resultSet;
						        for (var i in rows) {
						            results += "<tr><td>" + rows[i].cas +
                          "</td><td class='text-right'>" +
                          rows[i].temperatura_vrednost + " " 	+
                          rows[i].temperatura_enota + "</td>";
						        }
						        results += "</table>";
						        $("#rezultatMeritveVitalnihZnakov").append(results);
					    	} else {
					    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}

					    },
					    error: function() {
					    	$("#preberiMeritveVitalnihZnakovSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
				}
	    	},
	    	error: function(err) {
	    		$("#preberiMeritveVitalnihZnakovSporocilo").html(
            "<span class='obvestilo label label-danger fade-in'>Napaka '" +
            JSON.parse(err.responseText).userMessage + "'!");
	    	}
		});
	}
}


$(document).ready(function() {

  /**
   * Napolni testne vrednosti (ime, priimek in datum rojstva) pri kreiranju
   * EHR zapisa za novega bolnika, ko uporabnik izbere vrednost iz
   * padajočega menuja (npr. Pujsa Pepa).
   */
  $('#preberiPredlogoBolnika').change(function() {
    $("#kreirajSporocilo").html("");
    var podatki = $(this).val();
    $("#pacientEHR").val(podatki);
  });

  /**
   * Napolni testni EHR ID pri prebiranju EHR zapisa obstoječega bolnika,
   * ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Dejan Lavbič, Pujsa Pepa, Ata Smrk)
   */
	$('#preberiObstojeciEHR').change(function() {
		$("#preberiSporocilo").html("");
		$("#preberiEHRid").val($(this).val());
	});

  /**
   * Napolni testne vrednosti (EHR ID, datum in ura, telesna višina,
   * telesna teža, telesna temperatura, sistolični in diastolični krvni tlak,
   * nasičenost krvi s kisikom in merilec) pri vnosu meritve vitalnih znakov
   * bolnika, ko uporabnik izbere vrednosti iz padajočega menuja (npr. Ata Smrk)
   */
	$('#preberiObstojeciVitalniZnak').change(function() {
		$("#dodajMeritveVitalnihZnakovSporocilo").html("");
		var podatki = $(this).val().split("|");
		$("#dodajVitalnoEHR").val(podatki[0]);
		$("#dodajVitalnoDatumInUra").val(podatki[1]);
		$("#dodajVitalnoTelesnaVisina").val(podatki[2]);
		$("#dodajVitalnoTelesnaTeza").val(podatki[3]);
		$("#dodajVitalnoTelesnaTemperatura").val(podatki[4]);
		$("#dodajVitalnoKrvniTlakSistolicni").val(podatki[5]);
		$("#dodajVitalnoKrvniTlakDiastolicni").val(podatki[6]);
		$("#dodajVitalnoNasicenostKrviSKisikom").val(podatki[7]);
		$("#dodajVitalnoMerilec").val(podatki[8]);
	});

  /**
   * Napolni testni EHR ID pri pregledu meritev vitalnih znakov obstoječega
   * bolnika, ko uporabnik izbere vrednost iz padajočega menuja
   * (npr. Ata Smrk, Pujsa Pepa)
   */
	$('#preberiEhrIdZaVitalneZnake').change(function() {
		$("#preberiMeritveVitalnihZnakovSporocilo").html("");
		$("#rezultatMeritveVitalnihZnakov").html("");
		$("#meritveVitalnihZnakovEHRid").val($(this).val());
	});

});


function zgenerirajPodatkeZaEHR(ehrId,stPacienta){
		
		console.log("ehr Id je : " + ehrId + "st pacienta v zgeneriraj podatke je: " + stPacienta);
		
		if(stPacienta == 1){
			
			for(var i = 0; i < 60; i++){ // 20X se bo izvedel random za tega bolnika
			
			var leto = steviloRand(2000, 2016);
			var mesec = steviloRand2(1, 12);
			
			var dan = steviloRand2(1,29);
			
			var ura = steviloRand2(0, 24);
			var minute = steviloRand2(0, 59);
			var visina = steviloRand(120, 200);
			
			var teza = steviloRand(50, 100);
			
			var temp = steviloRand2(34, 39);
			
			var temperatura = Math.round(temp * 10 ) / 10;
			
			var sistolicniTlak = steviloRand(70, 80);
			
			var diastolicniTlak = steviloRand(50, sistolicniTlak);
			
			var visinaM = visina / 100;
			
			var nasicenost = steviloRand(85, 99);
			
			var datumInUra = leto + "-" + mesec + "-" + dan + "T" + ura + ":" + minute;
			
			
			
			
			dodajMeritveVitalnihZnakov(ehrId,datumInUra,visina,teza,temperatura,sistolicniTlak,diastolicniTlak,nasicenost);
			//tabela[stPacienta][i] = 
			}
		}
		
		else if(stPacienta == 2){
			
			for(var i = 0; i < 60; i++){ // 20X se bo izvedel random za tega bolnika
			
				var leto = steviloRand(2000, 2016);
				var mesec = steviloRand2(1, 12);
				
				var dan = steviloRand2(1,29);
				
				var ura = steviloRand2(0, 24);
				var minute = steviloRand2(0, 59);
				var visina = steviloRand(120, 200);
				
				var teza = steviloRand(50, 100);
				
				var temp = steviloRand2(34, 39);
				
				var temperatura = Math.round(temp * 10 ) / 10;
				
				var sistolicniTlak = steviloRand(90, 130);
				
				var diastolicniTlak = steviloRand(50, sistolicniTlak);
				
				var visinaM = visina / 100;
				
				var nasicenost = steviloRand(85, 99);
				
				var datumInUra = leto + "-" + mesec + "-" + dan + "T" + ura + ":" + minute;
				
				dodajMeritveVitalnihZnakov(ehrId,datumInUra,visina,teza,temperatura,sistolicniTlak,diastolicniTlak,nasicenost);
			}
		}
		else if(stPacienta == 3){
			
			for(var i = 0; i < 60; i++){ // 20X se bo izvedel random za tega bolnika
			
				var leto = steviloRand(2000, 2016);
				var mesec = steviloRand2(1, 12);
				
				var dan = steviloRand2(1,29);
				
				var ura = steviloRand2(0, 24);
				var minute = steviloRand2(0, 59);
				var visina = steviloRand(120, 200);
				
				var teza = steviloRand(50, 100);
				
				var temp = steviloRand2(34, 39);
				
				var temperatura = Math.round(temp * 10 ) / 10;
				
				var sistolicniTlak = steviloRand(150, 190);
				
				var diastolicniTlak = steviloRand(100, sistolicniTlak);
				
				var visinaM = visina / 100;
				
				var nasicenost = steviloRand(85, 99);
				
				var datumInUra = leto + "-" + mesec + "-" + dan + "T" + ura + ":" + minute;
				
				dodajMeritveVitalnihZnakov(ehrId,datumInUra,visina,teza,temperatura,sistolicniTlak,diastolicniTlak,nasicenost);
			}
		}
}

function generirajPodatke(){
	
	var stPacienta = $("#pacientEHR").val();
	
	console.log("stevilka pacienta v generirajPodatke: " + stPacienta);
	
	if(stPacienta == 1){ // zelo nizek krvni tlak!
		var ime ="Blaz";
		var priimek = "Oblak";
		var datumRojstva = "1996-01-10T09:08";
		
		kreirajEHRzaBolnika(ime,priimek,datumRojstva,stPacienta);
		
		
	}
	
		else if(stPacienta == 2){
		var ime ="Andrej";
		var priimek = "Hafner";
		var datumRojstva = "1990-06-10T08:09";
		
		kreirajEHRzaBolnika(ime,priimek,datumRojstva,stPacienta);
		
	}
	
		else if(stPacienta == 3){
		var ime ="Erik";
		var priimek = "Gratner";
		var datumRojstva = "1994-02-09T03:01";
		
		kreirajEHRzaBolnika(ime,priimek,datumRojstva,stPacienta);
		
	}
	
}

function steviloRand(min, max){
	var stevilo = Math.floor(Math.random() * (max - min + 1)) + min;
	return stevilo;
}

function steviloRand2(min, max){
	var stevilo = Math.floor(Math.random() * (max - min + 1)) + min;
	if (stevilo < 10){
		stevilo = "0" + stevilo;
	}
	return stevilo;
}

function vrniGraf(){
	
	sessionId = getSessionId();
	
	var ehrId = $("#meritveTlakaEHRid").val();
	var tip = $("#preberiTlak").val();
	
	if (!ehrId || ehrId.trim().length == 0 || !tip || tip.trim().length == 0) {
		
		$("#preberiMeritveVitalnihZnakovSporocilo").html("<span class='obvestilo " +
      "label label-warning fade-in'>Prosim vnesite zahtevan podatek!");
	}
	
	
	
	else{ 
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				$("#rezultatMeritveTlaka").html("<br/><span>Pridobivanje " +
          "podatkov za <b>'" + tip + "'</b> bolnika <b>'" + party.firstNames +
          " " + party.lastNames + "'</b>.</span><br/><br/>" + "<ul><li>Če je v nekem letu vaš sistolični tlak 0 potem to pomeni, da za to leto ni bilo vnešenih podatkov.</li> <li> Graf predstavlja povprečni izmerjeni krvni tlak, za vsako leto.</li></ul>");
          	
          	
          		
          			
          			
          			
          			$.ajax({
          				
  					    url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure?limit=60",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    
					    success: function (res) {
					    	
					    	
					    	// ________________________________________________________________________________________________________________SISTOLIC
					    	var tabelaTlak = [];
					    	for(var i = 0; i < 17; i++){
					    		tabelaTlak[i] = 0;
					    	}
					    	
					    	var tabelaLeto = [];
					    	var leto = 0;
					    	var count0 = 0, count1= 0, count2 = 0, count3 = 0, count4 = 0, count5 = 0, count6 = 0, count7 = 0, count8 = 0, count9 = 0, count10 = 0, count11 = 0, count12 = 0, count13 = 0, count14 = 0,count15 = 0,count16 = 0
					    	var stevilo = 0;
					    	if (res.length > 0) {
					    		
					    		for(var i in res){
					    			
					    			leto = res[i].time;
					    			tabelaLeto = leto.split("-");
					    			leto = tabelaLeto[0];
					    			console.log(leto)
					    			stevilo = parseInt(res[i].systolic)
					    			
					    			if(leto ==2000){
					    				count0++;
					    				tabelaTlak[0] += stevilo;
					    					
					    			}
					    			else if(leto ==2001){
					    					count1++;
					    					tabelaTlak[1] += stevilo;
					    			}
					    			else if(leto ==2002){
					    					count2++;
					    					tabelaTlak[2] += stevilo;
					    			}		
					    			else if(leto ==2003){
					    					count3++;
					    					tabelaTlak[3] += stevilo;
					    			}		
					    			else if(leto ==2004){
					    					count4++;
					    					tabelaTlak[4] += stevilo;
					    			}		
					    			else if(leto ==2005){
					    					count5++;
					    					tabelaTlak[5] += stevilo;
					    			}		
					    			else if(leto ==2006){
					    					count6++;
					    					tabelaTlak[6] += stevilo;
					    			}		
					    			else if(leto ==2007){
					    					count7++;
					    					tabelaTlak[7] += stevilo;
					    			}		
					    			else if(leto ==2008){
					    					count8++;
					    					tabelaTlak[8] += stevilo;
					    			}	
					    			else if(leto ==2009){
					    					count9++;
					    					tabelaTlak[9] += stevilo;
					    			}	
					    			else if(leto ==2010){
					    					count10++;
					    					tabelaTlak[10] += stevilo;
					    			}		
					    			else if(leto ==2011){
					    					count11++;
					    					tabelaTlak[11] += stevilo;
					    			}
					    			else if(leto ==2012){
					    					count12++;
					    					tabelaTlak[12] += stevilo;
					    			}	
					    			else if(leto ==2013){
					    					count13++;
					    					tabelaTlak[13] += stevilo;
					    			}		
					    			else if(leto ==2014){
					    					count14++;
					    					tabelaTlak[14] += stevilo;
					    			}	
					    			else if(leto ==2015){
					    					count15++;
					    					tabelaTlak[15] += stevilo;
					    			}	
					    			else if(leto ==2016){
					    					count16++;
					    					tabelaTlak[16] += stevilo;
					    				
					    			}
					    		}
					    		
					    		tabelaTlak[0] = tabelaTlak[0] / count0;
					    		tabelaTlak[1] = tabelaTlak[1] / count1;
					    		tabelaTlak[2] = tabelaTlak[2] / count2;
					    		tabelaTlak[3] = tabelaTlak[3] / count3;
					    		tabelaTlak[4] = tabelaTlak[4] / count4;
					    		tabelaTlak[5] = tabelaTlak[5] / count5;
					    		tabelaTlak[6] = tabelaTlak[6] / count6;
					    		tabelaTlak[7] = tabelaTlak[7] / count7;
					    		tabelaTlak[8] = tabelaTlak[8] / count8;
					    		tabelaTlak[9] = tabelaTlak[9] / count9;
					    		tabelaTlak[10] = tabelaTlak[10] / count10;
					    		tabelaTlak[11] = tabelaTlak[11] / count11;
					    		tabelaTlak[12] = tabelaTlak[12] / count12;
					    		tabelaTlak[13] = tabelaTlak[13] / count13;
					    		tabelaTlak[14] = tabelaTlak[14] / count14;
					    		tabelaTlak[15] = tabelaTlak[15] / count15;
					    		tabelaTlak[16] = tabelaTlak[16] / count16;
					    		
					    		//console.log("tabela tlak[0] = " + count0)
					    		console.log(tabelaTlak)
					    		
					    		
					    		
					    		//__________________________________________________________________________________________DIASTOLIC
					    		
					    				var tabelaTlak2 = [];
								    	for(var i = 0; i < 17; i++){
								    		tabelaTlak2[i] = 0;
								    	}
								    	
								    	var tabelaLeto2 = [];
								    	var leto2 = 0;
								    	var count0 = 0, count1= 0, count2 = 0, count3 = 0, count4 = 0, count5 = 0, count6 = 0, count7 = 0, count8 = 0, count9 = 0, count10 = 0, count11 = 0, count12 = 0, count13 = 0, count14 = 0,count15 = 0,count16 = 0
								    	var stevilo2 = 0;
								    	
								    		
								    		for(var i in res){
								    			
								    			leto2 = res[i].time;
								    			tabelaLeto2 = leto2.split("-");
								    			leto2 = tabelaLeto2[0];
								    			
								    			stevilo2 = parseInt(res[i].diastolic)
								    			
								    			if(leto2 ==2000){
								    				count0++;
								    				
								    				tabelaTlak2[0] += stevilo2;
								    					
								    			}
								    			else if(leto2 ==2001){
								    					count1++;
								    					tabelaTlak2[1] += stevilo2;
								    			}
								    			else if(leto2 ==2002){
								    					count2++;
								    					tabelaTlak2[2] += stevilo2;
								    			}		
								    			else if(leto2 ==2003){
								    					count3++;
								    					tabelaTlak2[3] += stevilo2;
								    			}		
								    			else if(leto2 ==2004){
								    					count4++;
								    					tabelaTlak2[4] += stevilo2;
								    			}		
								    			else if(leto2 ==2005){
								    					count5++;
								    					tabelaTlak2[5] += stevilo2;
								    			}		
								    			else if(leto2 ==2006){
								    					count6++;
								    					tabelaTlak2[6] += stevilo2;
								    			}		
								    			else if(leto2 ==2007){
								    					count7++;
								    					tabelaTlak2[7] += stevilo2;
								    			}		
								    			else if(leto2 ==2008){
								    					count8++;
								    					tabelaTlak2[8] += stevilo2;
								    			}	
								    			else if(leto2 ==2009){
								    					count9++;
								    					tabelaTlak2[9] += stevilo2;
								    			}	
								    			else if(leto2 ==2010){
								    					count10++;
								    					tabelaTlak2[10] += stevilo2;
								    			}		
								    			else if(leto2 ==2011){
								    					count11++;
								    					tabelaTlak2[11] += stevilo2;
								    			}
								    			else if(leto2 ==2012){
								    					count12++;
								    					tabelaTlak2[12] += stevilo2;
								    			}	
								    			else if(leto2 ==2013){
								    					count13++;
								    					tabelaTlak2[13] += stevilo2;
								    			}		
								    			else if(leto2 ==2014){
								    					count14++;
								    					tabelaTlak2[14] += stevilo2;
								    			}	
								    			else if(leto2 ==2015){
								    					count15++;
								    					tabelaTlak2[15] += stevilo2;
								    			}	
								    			else if(leto2 ==2016){
								    					count16++;
								    					tabelaTlak2[16] += stevilo2;
								    				
								    			}
								    		}
								    		
								    		tabelaTlak2[0] = tabelaTlak2[0] / count0;
								    		tabelaTlak2[1] = tabelaTlak2[1] / count1;
								    		tabelaTlak2[2] = tabelaTlak2[2] / count2;
								    		tabelaTlak2[3] = tabelaTlak2[3] / count3;
								    		tabelaTlak2[4] = tabelaTlak2[4] / count4;
								    		tabelaTlak2[5] = tabelaTlak2[5] / count5;
								    		tabelaTlak2[6] = tabelaTlak2[6] / count6;
								    		tabelaTlak2[7] = tabelaTlak2[7] / count7;
								    		tabelaTlak2[8] = tabelaTlak2[8] / count8;
								    		tabelaTlak2[9] = tabelaTlak2[9] / count9;
								    		tabelaTlak2[10] = tabelaTlak2[10] / count10;
								    		tabelaTlak2[11] = tabelaTlak2[11] / count11;
								    		tabelaTlak2[12] = tabelaTlak2[12] / count12;
								    		tabelaTlak2[13] = tabelaTlak2[13] / count13;
								    		tabelaTlak2[14] = tabelaTlak2[14] / count14;
								    		tabelaTlak2[15] = tabelaTlak2[15] / count15;
								    		tabelaTlak2[16] = tabelaTlak2[16] / count16;
					    		
					    		
					    			console.log(tabelaTlak2)
					    			$(function () {
					    				
								    $('#rezultatGraf').highcharts({
								        title: {
								            text: 'Average blood pressure',
								            x: -20 //center
								        },
								        subtitle: {
								            text: '',
								            x: -20
								        },
								        xAxis: {
								            categories: ['2000', '2001', '2002', '2003', '2004', '2005',
								                '2006', '2007', '2008', '2009', '2010', '2011','2012','2013','2014','2015','2016']
								        },
								        yAxis: {
								            title: {
								                text: 'Blood Pressure (mm Hg)'
								            },
								            plotLines: [{
								                value: 0,
								                width: 1,
								                color: '#808080'
								            }]
								        },
								        tooltip: {
								            valueSuffix: 'mm Hg'
								        },
								        legend: {
								            layout: 'vertical',
								            align: 'right',
								            verticalAlign: 'middle',
								            borderWidth: 0
								        },
								        series: [{
								            name: 'High blood pressure',
								            data: tabelaTlak
								        },{
								        	name:'Low blood pressure',
								        	data: tabelaTlak2
								        }]
								    });
								});
								
					    	
					    	}
					    	else {
					    		$("#preberiMeritveTlakaSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveTlakaSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
					
					
          		
	    	}
	    	});
		
		
		
		

}
}

function izpisiGrafStatistika(){
	
	
	var prva = $("#izpisiGrafStatistikaEHRid").val();
	var druga = $("#izpisiGrafStatistikaEHRidSpol").val();
	
	
	console.log(prva + " " + druga);
	prva = parseInt(prva);
	druga = parseInt(druga)
	
	if(prva == 1 && druga == 1){
		$(function () {
	    $('#rezultatStatistika').highcharts({
	        chart: {
	            plotBackgroundColor: null,
	            plotBorderWidth: null,
	            plotShadow: false,
	            type: 'pie'
	        },
	        title: {
	            text: 'Razvoj visokega krvnega pritiska glede na starost/moski'
	        },
	        tooltip: {
	            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
	        },
	        plotOptions: {
	            pie: {
	                allowPointSelect: true,
	                cursor: 'pointer',
	                dataLabels: {
	                    enabled: true,
	                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
	                    style: {
	                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
	                    }
	                }
	            }
	        },
	        
	        series: [{
	            name: 'Leta',
	            colorByPoint: true,
	            data: [{
	                name: '20-34',
	                y: 11.1
	            }, {
	                name: '35-44',
	                y: 25.1,
	                sliced: true,
	                selected: true
	            }, {
	                name: '45-54',
	                y: 37.1
	            }, {
	                name: '55-64',
	                y: 54.0
	            }, {
	                name: '65-74',
	                y: 64.0
	            }, {
	                name: '75 in starejsi',
	                y: 66.7
	            },{
	            	name: 'Vsi',
	              y: 34.1
	            }]
	        }]
	        
	        
	    });
	});
	}
	
	if(prva == 2 && druga == 1){
				$(function () {
			    $('#rezultatStatistika').highcharts({
			        chart: {
			            plotBackgroundColor: null,
			            plotBorderWidth: null,
			            plotShadow: false,
			            type: 'pie'
			        },
			        title: {
			            text: 'Graf glede na etnicno pripadnost/moski'
			        },
			        tooltip: {
			            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			        },
			        plotOptions: {
			            pie: {
			                allowPointSelect: true,
			                cursor: 'pointer',
			                dataLabels: {
			                    enabled: true,
			                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
			                    style: {
			                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
			                    }
			                }
			            }
			        },
			        series: [{
			            name: 'Leta',
			            colorByPoint: true,
			            data: [{
			                name: 'African Americans',
			                y: 43.0
			            }, {
			                name: 'Mexican Americans',
			                y: 27.8,
			                sliced: true,
			                selected: true
			            }, {
			                name: 'Whites',
			                y: 33.9
			            }, {
			                name: 'All',
			                y: 	34.1
			            }]
			        }]
			    });
			});
	}
	if(prva == 2 && druga == 2){
					$(function () {
			    $('#rezultatStatistika').highcharts({
			        chart: {
			            plotBackgroundColor: null,
			            plotBorderWidth: null,
			            plotShadow: false,
			            type: 'pie'
			        },
			        title: {
			            text: 'Graf glede na etnicno pripadnost/zenske'
			        },
			        tooltip: {
			            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			        },
			        plotOptions: {
			            pie: {
			                allowPointSelect: true,
			                cursor: 'pointer',
			                dataLabels: {
			                    enabled: true,
			                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
			                    style: {
			                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
			                    }
			                }
			            }
			        },
			        series: [{
			            name: 'Leta',
			            colorByPoint: true,
			            data: [{
			                name: 'African Americans',
			                y: 45.7
			            }, {
			                name: 'Mexican Americans',
			                y: 28.9,
			                sliced: true,
			                selected: true
			            }, {
			                name: 'Whites',
			                y: 31.3
			            }, {
			                name: 'All',
			                y: 	32.7
			            }]
			        }]
			    });
			});
	}
	if(prva == 1 && druga == 2){
				$(function () {
			    $('#rezultatStatistika').highcharts({
			        chart: {
			            plotBackgroundColor: null,
			            plotBorderWidth: null,
			            plotShadow: false,
			            type: 'pie'
			        },
			        title: {
			            text: 'Razvoj visokega krvnega pritiska glede na starost/zenske'
			        },
			        tooltip: {
			            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
			        },
			        plotOptions: {
			            pie: {
			                allowPointSelect: true,
			                cursor: 'pointer',
			                dataLabels: {
			                    enabled: true,
			                    format: '<b>{point.name}</b>: {point.percentage:.1f} %',
			                    style: {
			                        color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
			                    }
			                }
			            }
			        },
			        
			        series: [{
			            name: 'Leta',
			            colorByPoint: true,
			            data: [{
			                name: '20-34',
			                y: 6.8
			            }, {
			                name: '35-44',
			                y: 19.0,
			                sliced: true,
			                selected: true
			            }, {
			                name: '45-54',
			                y: 35.2
			            }, {
			                name: '55-64',
			                y: 53.3
			            }, {
			                name: '65-74',
			                y: 69.3
			            }, {
			                name: '75 in starejsi',
			                y: 78.5
			            },{
			            	name: 'Vsi',
			              y: 32.7
			            }]
			        }]
			        
			        
			    });
			});
	}
	
}

function vrniWiki(){
		var ehrId = $("#wikipediaEHRID").val();
	
		sessionId = getSessionId();
		
		$.ajax({
			url: baseUrl + "/demographics/ehr/" + ehrId + "/party",
	    	type: 'GET',
	    	headers: {"Ehr-Session": sessionId},
	    	success: function (data) {
				var party = data.party;
				
          			$.ajax({
          				
  					    url: baseUrl + "/view/" + ehrId + "/" + "blood_pressure",
					    type: 'GET',
					    headers: {"Ehr-Session": sessionId},
					    success: function (res) {
					    	if (res.length > 0) {
						    	var results = "<table class='table " +
                    "table-hover'><tr><th>Datum in ura</th>" +
                    "<th class='text-right'>Tlak</th></tr>";
                    			var sestevekTlakSistolicni = 0;
                    			
						        for (var i in res) {
						        	
						        	sestevekTlakSistolicni += res[i].systolic;
						        	
						        }
						        
						        var povprecniTlakSistolicni = sestevekTlakSistolicni / res.length;
						        var url = "";
						        
						        	if(povprecniTlakSistolicni < 80){
						        		url = "https://en.wikipedia.org/wiki/Diastole"
						        	}
						        	else if(povprecniTlakSistolicni > 80 && povprecniTlakSistolicni < 130){
						        		url = "https://en.wikipedia.org/wiki/Blood_pressure";
						        	}
						        	else if(povprecniTlakSistolicni > 130){
						        		url = "https://en.wikipedia.org/wiki/Systole"
						        	}
						        					var title = url.split("/");
													title = title[title.length - 1];
													 
													//Get Leading paragraphs (section 0)
													$.getJSON("https://en.wikipedia.org/w/api.php?action=parse&page=" + title + "&prop=text&section=0&format=json&callback=?", function (data) {
														
													    for (text in data.parse.text) {
												        var text = data.parse.text[text].split("<p>");
												        var pText = "";
																for (p in text) {
													            //Remove html comment
													            text[p] = text[p].split("<!--");
													            if (text[p].length > 1) {
													                text[p][0] = text[p][0].split(/\r\n|\r|\n/);
													                text[p][0] = text[p][0][0];
													                text[p][0] += "</p> ";
													            }
													            text[p] = text[p][0];
													
													            //Construct a string from paragraphs
													            if (text[p].indexOf("</p>") == text[p].length - 5) {
													                var htmlStrip = text[p].replace(/<(?:.|\n)*?>/gm, '') //Remove HTML
													                var splitNewline = htmlStrip.split(/\r\n|\r|\n/); //Split on newlines
													                for (newline in splitNewline) {
													                    if (splitNewline[newline].substring(0, 11) != "Cite error:") {
													                        pText += splitNewline[newline];
													                        pText += "\n";
													                    }
													                }
													            }
													        }
													        pText = pText.substring(0, pText.length - 2); //Remove extra newline
													        pText = pText.replace(/\[\d+\]/g, ""); //Remove reference tags (e.x. [1], [4], etc)
													       console.log(pText)

													    	pText = "<p><span>" + pText + "</p></span>"
					    									 $("#rezultatWikipedijaRes").append(pText);
													    }
													    
					    	
													});
          			    
					    	} else {
					    		$("#preberiMeritveTlakaSporocilo").html(
                    "<span class='obvestilo label label-warning fade-in'>" +
                    "Ni podatkov!</span>");
					    	}
					    },
					    error: function() {
					    	$("#preberiMeritveTlakaSporocilo").html(
                  "<span class='obvestilo label label-danger fade-in'>Napaka '" +
                  JSON.parse(err.responseText).userMessage + "'!");
					    }
					});
	    	}
	    	});
	


}