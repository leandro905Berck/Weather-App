/**
 * AI FALLBACK ENGINE - Weather App BR
 * Este arquivo contém o motor de insights local utilizado quando a API do Gemini atinge o limite.
 * Ele gera análises dinâmicas, contextuais e naturais baseadas no clima real.
 */

const FALLBACK_ENGINE = {
    // 1. UTILITÁRIOS DE CONTEXTO
    getSeason(lat, month) {
        if (lat < 0) { // Hemisfério Sul
            if ([12, 1, 2].includes(month)) return 'Verão';
            if ([3, 4, 5].includes(month)) return 'Outono';
            if ([6, 7, 8].includes(month)) return 'Inverno';
            return 'Primavera';
        } else { // Hemisfério Norte
            if ([12, 1, 2].includes(month)) return 'Inverno';
            if ([3, 4, 5].includes(month)) return 'Primavera';
            if ([6, 7, 8].includes(month)) return 'Verão';
            return 'Outono';
        }
    },

    getTimeOfDay(hours) {
        if (hours >= 5 && hours < 12) return 'Manhã';
        if (hours >= 12 && hours < 18) return 'Tarde';
        if (hours >= 18 && hours < 23) return 'Noite';
        return 'Madrugada';
    },

    getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    // 2. BIBLIOTECA DE TEMPLATES (MASSIVA)
    templates: {
        RESUMO: {
            heat: [
                "${city} vive uma ${period} de ${season} de calor intenso com ${temp}°C. O céu indica ${desc}.",
                "Calorão em ${city}! Termômetros batendo ${temp}°C nesta ${period} de ${season}.",
                "O sol não dá trégua: ${city} registra ${temp}°C agora, clima de ${season} puro.",
                "Sensação de mormaço em ${city} com ${temp}°C. ${desc} predomina nesta ${period}.",
                "Prepare o ventilador! ${city} atinge ${temp}°C sob um céu de ${desc}.",
                "Tarde escaldante em ${city} com ${temp}°C. A umidade de ${humidity}% aumenta o abafamento.",
                "Clima de praia em ${city}! Faz ${temp}°C nesta ${period} ensolarada de ${season}.",
                "O verão antecipado em ${city}: temos ${temp}°C e ${desc} agora.",
                "Ar quente pairando sobre ${city}. Registramos ${temp}°C nesta ${period}.",
                "Dia de sol forte em ${city}! Proteja-se do calor de ${temp}°C.",
                "Clima de deserto em ${city}! ${temp}°C e sensação de abafamento constante.",
                "O sol não perdoa: ${city} sob ${temp}°C nesta ${period} de ${season}.",
                "Fritando em ${city}! Termômetros marcam ${temp}°C, mormaço total no ar.",
                "Calorão histórico? ${city} registra ${temp}°C sob um céu de ${desc}.",
                "Dia de derreter em ${city}. ${temp}°C e umidade em ${humidity}% geram desconforto.",
                "Solzão na medida (ou nem tanto)! Faz ${temp}°C agora em ${city}.",
                "Sombra e água fresca! ${city} atinge ${temp}°C com ventos de ${wind}km/h.",
                "Mormaço pesado em ${city}. Os ${temp}°C parecem bem mais nesta ${period}.",
                "O asfalto ferve em ${city}! Registramos ${temp}°C sob um céu de ${desc}.",
                "Clima tropical raiz em ${city}: calor de ${temp}°C e umidade de ${humidity}%."
            ],
            cold: [
                "Clima gelado em ${city}! Faz ${temp}°C nesta ${period} de ${season}.",
                "${city} tem uma ${period} de ${season} bem fria com apenas ${temp}°C.",
                "O frio chegou com tudo em ${city}: ${temp}°C registrados e ${desc}.",
                "Ideal para um café: ${city} registra ${temp}°C sob um céu de ${desc}.",
                "Blusa reforçada em ${city}! Termômetros em ${temp}°C nesta ${period} de ${season}.",
                "Madrugada fria em ${city}? Agora temos ${temp}°C com ${desc}.",
                "Inverno rigoroso em ${city}: apenas ${temp}°C registrados.",
                "O vento frio corta ${city} hoje. Faz ${temp}°C com ${desc}.",
                "Tempo gelado predominando em ${city} nesta ${period} com ${temp}°C.",
                "${city} sente o rigor da ${season}: temperatura estável em ${temp}°C.",
                "Frio cortante em ${city}! Proteja as extremidades do corpo, faz ${temp}°C.",
                "Madrugada glacial registrada em ${city}. Agora os termômetros marcam ${temp}°C.",
                "O clima de ${city} hoje lembra o Polo Sul! Mantenha-se aquecido com ${temp}°C.",
                "Friaca braba em ${city}! Apenas ${temp}°C e vento de ${wind}km/h.",
                "Clima de Gramado em ${city}? ${temp}°C e céu de ${desc} dão o tom.",
                "Vento gelado em ${city}. Proteja-se, faz ${temp}°C nesta ${period}.",
                "${city} vira uma geladeira! Registramos ${temp}°C agora no termômetro.",
                "Ideal para fondue: ${city} marca ${temp}°C com umidade de ${humidity}%.",
                "Ar polar sobre ${city}. Prepare o cachecol para encarar os ${temp}°C.",
                "O orvalho congela em ${city}. Temos ${temp}°C e uma brisa de ${wind}km/h."
            ],
            snow: [
                "Neve em ${city}! Um fenômeno raro e magnífico ocorrendo agora com ${temp}°C.",
                "Cenário de filme em ${city}: neve caindo e temperatura em ${temp}°C.",
                "Tudo branco em ${city}! A neve transforma a paisagem nesta ${period} de ${temp}°C.",
                "Alerta de neve acumulada em ${city}. Cuidado ao circular, faz ${temp}°C.",
                "Frio extremo e neve em ${city}. Aproveite a vista, mas mantenha-se em local aquecido.",
                "Flocos de neve em ${city}! Um espetáculo visual com apenas ${temp}°C.",
                "Inverno mágico em ${city}: a neve cobre tudo enquanto faz ${temp}°C.",
                "Alerta de gelo e neve em ${city}. Mantenha-se seguro nos ${temp}°C.",
                "Cenário glacial em ${city}. A neve traz silêncio e frio de ${temp}°C.",
                "Neve caindo suave em ${city}. Um registro histórico com ${temp}°C agora."
            ],
            mild: [
                "${city} tem uma ${period} de ${season} agradável. Faz ${temp}°C com ${desc}.",
                "Clima ameno e confortável em ${city} hoje: ${temp}°C e ${desc}.",
                "Uma ${period} tranquila em ${city}! A temperatura está em ${temp}°C.",
                "${city} registra ${temp}°C nesta ${period} de ${season}. Condição de ${desc}.",
                "Tempo bom em ${city}! ${temp}°C ideais para circular ao ar livre.",
                "${city} desfruta de uma ${period} refrescante com ${temp}°C.",
                "Equilíbrio térmico em ${city}: nem muito quente, nem frio. Apenas ${temp}°C.",
                "Um toque de frescor nesta ${period} em ${city}. Faz ${temp}°C agora.",
                "${city} apresenta um clima clássico de ${season}: ${temp}°C e ${desc}.",
                "Dia muito agradável em ${city}! Aproveite os ${temp}°C e céu de ${desc}.",
                "Clima de primavera em ${city}! ${temp}°C perfeitos para um passeio.",
                "Ar puro e temperatura na medida: ${city} marca ${temp}°C hoje.",
                "Nem casaco, nem ventilador: ${city} está com ótimos ${temp}°C.",
                "A ${period} em ${city} convida para sair. São ${temp}°C com céu de ${desc}.",
                "Frescor matinal se estende em ${city}. Registramos ${temp}°C agora.",
                "Dia de luz suave em ${city}. Os ${temp}°C trazem conforto total.",
                "Clima harmônico em ${city}. ${temp}°C e umidade de ${humidity}%.",
                "Aproveite o equilíbrio: ${city} está com temperatura de ${temp}°C.",
                "Tempo firme e agradável em ${city}. Faz ${temp}°C nesta ${period}.",
                "Paz no horizonte de ${city}: clima estável com ${temp}°C e ${desc}."
            ],
            rain: [
                "Tempo instável em ${city} com ${temp}°C e ${desc}. Clima típico de ${season}.",
                "Chuva em ${city} nesta ${period}. Os termômetros marcam ${temp}°C agora.",
                "O clima em ${city} pede atenção: ${desc} com ${temp}°C nesta ${period}.",
                "Dia molhado em ${city}! ${desc} com umidade em ${humidity}%.",
                "Guarda-chuva à mão em ${city}! Temos ${temp}°C e chuva constante.",
                "${city} sob águas: ${desc} registrado agora com ${temp}°C.",
                "Precipitação em ${city} refresca o ar para ${temp}°C nesta ${period}.",
                "Tempo fechado e úmido em ${city}. Faz ${temp}°C e umidade em ${humidity}%.",
                "Chuva leve em ${city} nesta ${period} de ${season}. Temperatura em ${temp}°C.",
                "O som da chuva em ${city}! Faz ${temp}°C com umidade alta.",
                "Céu chorando em ${city}. ${desc} com ${temp}°C e muita umidade no ar.",
                "Pé d'água em ${city}! ${desc} predominando com força nesta ${period}.",
                "Barulhinho de chuva em ${city}. Faz ${temp}°C, clima de filme hoje.",
                "Guarda-chuva é o acessório do dia em ${city}. ${desc} ocorrendo agora.",
                "Refresco vindo do céu: chuva em ${city} baixa o calor para ${temp}°C.",
                "Solo molhado em ${city}. A umidade de ${humidity}% traz frescor com ${temp}°C.",
                "Chuva persistente em ${city}. Os termômetros não passam de ${temp}°C.",
                "Dia cinzento e úmido em ${city}. ${desc} com temperatura de ${temp}°C.",
                "A natureza agradece: chuva em ${city} com temperatura amena de ${temp}°C.",
                "Clima de interior: chuva em ${city} e aquele cheiro de terra molhada."
            ],
            storm: [
                "Alerta de tempestade em ${city}! ${desc} com ventos de ${wind}km/h.",
                "Tempo severo em ${city}: tempestades isoladas e ${temp}°C agora.",
                "Cuidado em ${city}! ${desc} forte com raios e rajadas de vento.",
                "Tempestade de ${season} atingindo ${city}. Procure abrigo seguro.",
                "Céu perigoso em ${city}: ${desc} intensa nestas últimas horas.",
                "O tempo fechou pesado em ${city}! ${desc} com muitos raios e trovões.",
                "Cuidado redobrado em ${city}! Tempestade severa com ${temp}°C.",
                "Céu cor de chumbo sobre ${city}. ${desc} e ventos fortes de ${wind}km/h.",
                "Alerta meteorológico para ${city}: risco de alagamentos com esta tempestade.",
                "A força da natureza em ${city}: ventania e ${desc} assustam nesta ${period}."
            ],
            cloudy: [
                "Céu encoberto em ${city}. Faz ${temp}°C nesta ${period} cinzenta.",
                "Muitas nuvens sobre ${city} agora. Temperatura amena de ${temp}°C.",
                "${city} sob um tapete de nuvens: ${desc} com ${temp}°C.",
                "O sol se esconde em ${city} nesta ${period} nublada de ${season}.",
                "Clima nublado mas estável em ${city}. Faz ${temp}°C no momento.",
                "Sol com preguiça em ${city}. ${desc} domina a ${period} totalmente.",
                "Tapete de nuvens cinzas sobre ${city}. Faz ${temp}°C e vento de ${wind}km/h.",
                "Clima de 'fica em casa': céu nublado em ${city} com ${temp}°C.",
                "Luz difusa em ${city}. O sol não consegue romper o ${desc} de hoje.",
                "Dia opaco em ${city}. ${desc} traz um tom melancólico com ${temp}°C."
            ]
        },
        SAUDE: {
            dry_air: [
                "Ar muito seco em ${city} (${humidity}%). Hidrate-se constantemente!",
                "Atenção à hidratação! Umidade em ${humidity}% em ${city} dificulta a respiração.",
                "Umidade baixa registrada (${humidity}%). Use umidificadores se estiver em ambiente fechado.",
                "Tempo seco em ${city} pode causar irritação. Beba bastante água agora.",
                "Cuidado com as vias aéreas: a umidade está crítica em ${city} (${humidity}%).",
                "Hidrate-se! Com ${humidity}% de umidade, sua pele e pulmões precisam de atenção.",
                "Nível de umidade abaixo do ideal em ${city}. Evite exercícios intensos no seco.",
                "Umidade do ar em ${humidity}%. Mantenha o corpo hidratado nesta ${period}.",
                "Alerta de ar seco em ${city}. A saúde respiratória exige cuidados extras.",
                "Proteja-se do ressecamento: tome água, mesmo sem sede, pois a umidade está em ${humidity}%."
            ],
            uv_high: [
                "Índice UV perigoso! Use protetor solar mesmo com ${desc} em ${city}.",
                "Proteção essencial: radiação UV alta nesta ${period} em ${city}.",
                "Sol forte em ${city}! Evite exposição direta entre 10h e 16h para evitar queimaduras.",
                "Fator de proteção obrigatório em ${city} hoje. Radiação UV extrema atingida.",
                "Não se engane com as nuvens: o índice UV está alto em ${city} (${temp}°C).",
                "Pele protegida sempre! O UV de hoje em ${city} não perdoa descuidos.",
                "Chapéu e óculos de sol são seus melhores amigos em ${city} nesta ${period}.",
                "Alerta de radiação solar intensa em ${city}. Busque sombra sempre que possível.",
                "A radiação ultravioleta está em níveis críticos em ${city} agora.",
                "Cuidado redobrado com crianças e idosos sob este UV forte em ${city}."
            ],
            aqi_bad: [
                "Qualidade do ar ruim (Índice ${aqi}). Evite atividades físicas intensas ao ar livre.",
                "Ar poluído em ${city} hoje. Grupos sensíveis devem ter cuidado redobrado.",
                "Níveis de poluição elevados em ${city}. Use máscara se for circular em áreas de tráfego.",
                "A qualidade do ar em ${city} está prejudicada nesta ${period}. Evite esforço físico.",
                "Partículas no ar atingem níveis preocupantes em ${city}. Respire com cautela.",
                "Alerta ambiental em ${city}: poluição acima do recomendado para a saúde.",
                "Ar pesado em ${city}. Se sentir cansaço, procure ambientes fechados e frescos.",
                "Visibilidade e saúde afetadas pela poluição em ${city} (AQI ${aqi}).",
                "Proteja seus pulmões: o índice de qualidade do ar está ruim em ${city} agora.",
                "Dia desfavorável para esportes externos em ${city} devido à má qualidade do ar."
            ],
            mild: [
                "Qualidade do ar excelente em ${city}! Ótimo momento para respirar fundo.",
                "Umidade em ${humidity}%. Equilíbrio perfeito para sua saúde nesta ${period}.",
                "Condições favoráveis para o bem-estar em ${city} hoje.",
                "Respire aliviado: o ar de ${city} está puro e a temperatura agradável (${temp}°C).",
                "Momento ideal para oxigenar o cérebro em um parque de ${city}.",
                "Saúde em dia: umidade e qualidade do ar exemplares em ${city} agora.",
                "Clima propício para o equilíbrio do corpo e mente em ${city}.",
                "A umidade de ${humidity}% garante conforto respiratório nesta ${period}.",
                "Níveis de poluentes baixos em ${city}. Aproveite o frescor do dia.",
                "Tudo certo com o ambiente em ${city}: respire com tranquilidade."
            ]
        },
        DICA: [
            "Bom momento para uma caminhada leve, aproveitando os ${temp}°C em ${city}.",
            "Considere levar um casaco leve, a temperatura de ${temp}°C pode cair mais à noite.",
            "Com ${desc}, a visibilidade está reduzida. Dirija com atenção em ${city}.",
            "Aproveite a ${period} em ${city}! O clima de ${season} está inspirador hoje.",
            "Não esqueça o guarda-chuva, o céu indica ${desc} e a umidade está alta.",
            "Mantenha as janelas abertas para circular o ar de ${city} nesta ${period} agradável.",
            "Ideal para atividades leves ao ar livre. O clima em ${city} está favorável.",
            "Dia perfeito para fotografar as paisagens de ${city} sob esta luz de ${season}.",
            "Economize energia: o clima ameno de ${temp}°C permite desligar o ar-condicionado.",
            "Prefira roupas de tecidos naturais para lidar com a umidade de ${humidity}% em ${city}.",
            "Regue suas plantas no fim da tarde para aproveitar a umidade de ${humidity}%.",
            "Mantenha-se hidratado mesmo se não sentir calor; o corpo perde água com ${wind}km/h de vento.",
            "Planeje sua rota evitando áreas arborizadas se houver rajadas de vento em ${city}.",
            "Aproveite para ler um livro perto da janela nesta ${period} tranquila em ${city}.",
            "Verifique a calibração dos pneus: mudanças bruscas para ${temp}°C afetam a pressão.",
            "Ideal para um passeio no parque com os pets nesta temperatura de ${temp}°C.",
            "Se for sair, não esqueça o protetor labial; o clima de ${season} pode ressecá-los.",
            "Mantenha seu umidificador por perto se for passar muito tempo em locais lacrados.",
            "Dia excelente para lavar roupas: a umidade e o vento de ${wind}km/h vão ajudar.",
            "Aproveite a brisa de ${wind}km/h para ventilar sua casa em ${city} hoje.",
            "Uma xícara de chá cai bem com este clima de ${temp}°C e ${desc}.",
            "Dica de ouro: use este tempo de ${desc} para colocar as séries em dia.",
            "Se for exercitar-se, prefira horários com temperatura próxima de ${temp}°C.",
            "O vento de ${wind}km/h pode refrescar seu ambiente, abra as janelas opostas.",
            "Mantenha uma garrafa de água sempre à vista, a umidade de ${humidity}% exige atenção."
        ],
        ALERTA: [
            "Ventos de ${wind}km/h em ${city}. Cuidado com objetos soltos em sacadas.",
            "Mudança brusca de tempo prevista. Acompanhe o radar para evitar surpresas.",
            "Sensação térmica de ${temp}°C exige cuidado com o choque térmico.",
            "Rajadas de vento detectadas! A segurança em áreas abertas de ${city} é prioridade.",
            "Alerta de visibilidade baixa em ${city} devido a ${desc}. Reduza a velocidade.",
            "Aviso de tempestade iminente! Procure abrigo e evite áreas descampadas.",
            "Temperaturas batendo recordes para a ${season} em ${city}: atenção máxima.",
            "Queda súbita de pressão atmosférica; mudança de tempo nas próximas horas.",
            "Alerta de rajadas acima da média em ${city} (${wind}km/h). Telefone 193 se ver árvores em risco.",
            "Clima severo se aproximando de ${city}. Recomenda-se cancelar atividades externas.",
            "Alerta: condições propícias para mudanças rápidas no céu de ${city}.",
            "Cuidado ao dirigir: o vento de ${wind}km/h pode afetar a estabilidade do veículo.",
            "Evite estacionar debaixo de árvores com ventos de ${wind}km/h registrados.",
            "Proteja seus eletrônicos: risco de descargas elétricas com esta ${desc}.",
            "Mantenha-se informado: o clima em ${city} está em transição crítica agora."
        ]
    },

    // 3. CÁLCULO DE FASE DA LUA (Aproximação astronômica)
    getMoonPhase(date) {
        const lp = 2551443;
        const new_moon = new Date(1970, 0, 7, 20, 35, 0).getTime();
        const phase = ((date.getTime() - new_moon) % lp) / lp;
        if (phase < 0.06) return "Nova";
        if (phase < 0.19) return "Crescente Côncava";
        if (phase < 0.31) return "Quarto Crescente";
        if (phase < 0.44) return "Crescente Gibosa";
        if (phase < 0.56) return "Cheia";
        if (phase < 0.69) return "Minguante Gibosa";
        if (phase < 0.81) return "Quarto Minguante";
        if (phase < 0.94) return "Minguante Côncava";
        return "Nova";
    },

    // 4. FUNÇÃO PRINCIPAL
    generate(current, forecast, aqi) {
        // Proteção contra dados ausentes
        if (!current || !current.main || !current.weather) return null;

        const city = current.name || 'sua região';
        const temp = Math.round(current.main.temp);
        const humidity = current.main.humidity;
        const wind = Math.round(current.wind.speed * 3.6);
        const desc = current.weather[0].description;
        const aqiVal = aqi?.list?.[0]?.main?.aqi || 1;
        const uv = current.uvi || 0;

        // Dados de Chuva/Neve Futura (Probabilidade)
        const pop = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;

        // Busca o próximo evento significativo (chuva ou neve) nos 5 dias
        const nextEvent = forecast?.list?.find(item => item.pop >= 0.3);
        let nextEventData = null;

        if (nextEvent && nextEvent.weather && nextEvent.weather[0]) {
            const date = new Date(nextEvent.dt * 1000);
            const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
            const dayName = days[date.getDay()];
            const hour = date.getHours();
            const eventType = (nextEvent.weather[0].description.toLowerCase().includes('neve') || nextEvent.weather[0].description.toLowerCase().includes('snow')) ? 'neve' : 'chuva';

            nextEventData = {
                day: dayName,
                time: `${hour}h`,
                prob: Math.round(nextEvent.pop * 100),
                type: eventType
            };
        }

        const timezone = current.timezone || 0;
        const localTimeEpoch = new Date().getTime() + (timezone * 1000) + (new Date().getTimezoneOffset() * 60000);
        const now = new Date(localTimeEpoch);

        const season = this.getSeason(current?.coord?.lat || 0, now.getMonth() + 1);
        const period = this.getTimeOfDay(now.getHours());
        const moon = this.getMoonPhase(now);
        const clouds = current.clouds?.all || 0;

        // Lógica de Amanhecer / Entardecer / Dia / Noite
        const sunrise = current.sys?.sunrise ? new Date(current.sys.sunrise * 1000) : null;
        const sunset = current.sys?.sunset ? new Date(current.sys.sunset * 1000) : null;
        const diffSunrise = sunrise ? Math.abs(now - sunrise) / 60000 : 999;
        const diffSunset = sunset ? Math.abs(now - sunset) / 60000 : 999;

        let solarStatus = (now > sunrise && now < sunset) ? 'Dia' : 'Noite';
        if (diffSunrise < 40) solarStatus = 'Amanhecer';
        else if (diffSunset < 40) solarStatus = 'Entardecer';

        const ctx = {
            city, temp, humidity, wind, desc, season, period, aqi: aqiVal, uv, pop, moon, clouds, solarStatus,
            nextEventDay: nextEventData?.day,
            nextEventTime: nextEventData?.time,
            nextEventProb: nextEventData?.prob,
            nextEventType: nextEventData?.type
        };

        const insights = [];

        // 1. RESOLVER RESUMO (Sempre o primeiro)
        let resumoGroup = 'mild';
        const d = desc.toLowerCase();

        if (d.includes('tempestade') || d.includes('trovão') || d.includes('raios')) resumoGroup = 'storm';
        else if (d.includes('neve') || d.includes('snow')) resumoGroup = 'snow';
        else if (d.includes('chuva') || d.includes('garoa') || d.includes('chuvisco')) resumoGroup = 'rain';
        else if (d.includes('nuvens') || d.includes('nublado') || d.includes('encoberto')) resumoGroup = 'cloudy';
        else if (temp >= 28) resumoGroup = 'heat';
        else if (temp <= 15) resumoGroup = 'cold';

        const icons = { rain: '🌧️', heat: '☀️', cold: '❄️', mild: '🌤️', storm: '⛈️', cloudy: '☁️', snow: '❄️☃️' };
        const titles = {
            rain: ['Céu Chuvoso', 'Águas de ${season}', 'Radar de Chuva', 'Tempo Molhado', 'Chuva à Vista!', 'Céu Chorando', 'Molha o Chão', 'Refresco da Terra', 'Barulhinho de Chuva', 'Tempo de Guarda-Chuva', 'Dia Cinzento'],
            heat: ['Calor Intenso', 'Sol Radiante', 'Alerta de Calor', 'Dia de Verão', 'Calorão!', 'O Sol Tá On!', 'Mormaço Forte', 'Clima Desértico', 'Fritando em ${city}', 'Verão Raiz', 'Abafamento Total'],
            cold: ['Frio Intenso', 'Clima Gelado', 'Aviso de Frio', 'Baixas Temperaturas', 'Friozinho Bom?', 'Geada no Horizonte?', 'Toca e Cachecol', 'Clima de Montanha', 'Geladeira Aberta', 'Vento Cortante', 'Congelando em ${city}'],
            mild: ['Tempo Bom', 'Céu Aberto', 'Clima Ameno', 'Dia Agradável', 'Clima Perfeito', 'Dia de Passeio', 'Frescor de ${season}', 'Equilíbrio Térmico', 'Paz no Horizonte', 'Céu de Brigadeiro', 'Aproveite o Dia'],
            storm: ['Alerta Máximo', 'Tempestade!', 'Céu Perigoso', 'Clima Severo', 'Cuidado!', 'Tempo Fechou!', 'Força da Natureza', 'Raio e Trovão', 'Alerta de Perigo', 'Céu de Chumbo', 'Proteja-se!'],
            cloudy: ['Muitas Nuvens', 'Céu Cinzento', 'Tempo Nublado', 'Horizonte Encoberto', 'Cadê o Sol?', 'Tapete Cinza', 'Luz Suave', 'Dia de Preguiça', 'Nuvens de Algodão', 'Clima em Suspenso', 'Sombra Natural'],
            snow: ['Neve na Área', 'Alerta de Neve', 'Cenário Glacial', 'Mundo Branco', 'Neve à Vista!', 'Cenário Gelado', 'Inverno Mágico', 'Pó Branco', 'Frio de Filme', 'Boneco de Neve?', 'Alerta de Gelo']
        };

        // Adicionando frases contextuais ricas ao banco
        const newAdditions = [
            '${city} sob uma Lua ${moon}. A ${period} de ${season} segue com ${temp}°C e ${desc}.',
            'A ${period} em ${city} registra ${temp}°C. A visibilidade indica ${desc} com ventos de ${wind}km/h.',
            'Céu de ${city} mostra ${desc}. Temos ${humidity}% de umidade agora, clima típico de ${season}.',
            'Sensação real de ${temp}°C em ${city}. Com o céu em ${desc}, a atmosfera de ${solarStatus} domina o horizonte.',
            '${city} em modo ${season}: ${temp}°C e céu de ${desc}. A umidade de ${humidity}% dita o ritmo.',
            'O panorama em ${city} é de ${desc}. Com ${temp}°C, a ${period} se desenrola sob a influência da Lua ${moon}.'
        ];

        // Lógica solar e de dia/noite
        if (solarStatus === 'Amanhecer') {
            newAdditions.push('O sol está surgindo em ${city}! Um belo amanhecer com ${temp}°C para começar o dia.');
        } else if (solarStatus === 'Entardecer') {
            newAdditions.push('O pôr do sol em ${city} está acontecendo. O entardecer de ${season} traz um tom dourado ao céu.');
        }

        if (solarStatus === 'Noite') {
            if (moon === 'Nova' && clouds < 20) {
                newAdditions.push('Com a Lua Nova e o céu limpo em ${city}, as estrelas estão magníficas hoje. Ótimo momento para observar o cosmos!');
            } else if (moon === 'Cheia' && clouds === 0) {
                newAdditions.push('A Lua Cheia está radiante com 100% de visibilidade em ${city}. Não perca a chance de admirar esse espetáculo agora!');
            }
        }

        insights.push({
            icon: icons[resumoGroup] || '🌤️',
            category: 'Resumo',
            title: this.interpolate(this.getRandom(titles[resumoGroup] || ['Clima Agora']), ctx),
            message: this.interpolate(this.getRandom([...this.templates.RESUMO[resumoGroup], ...newAdditions]), ctx)
        });

        // 2. RESOLVER PREVISÃO OU SAÚDE (Baseado em criticidade)
        if (nextEventData && nextEventData.prob >= 40) {
            const forecastTitles = nextEventData.type === 'neve' ?
                ['Alerta de Neve', 'Olho no Floco', 'Neve à Vista'] :
                ['Radar de Chuva', 'Programe-se', 'Olho no Céu', 'Tendência'];

            insights.push({
                icon: nextEventData.type === 'neve' ? '❄️' : '☔',
                category: 'Previsão',
                title: this.getRandom(forecastTitles),
                message: this.interpolate(this.getRandom([
                    'Fique atento: há ${nextEventProb}% de chance de ${nextEventType} em ${city} para esta ${nextEventDay} por volta de ${nextEventTime}.',
                    'Se prepara, ${nextEventType} vindo aí! Prepare-se para ${nextEventDay} às ${nextEventTime} (${nextEventProb}% de chance).',
                    'Possível ${nextEventType} detectada para ${nextEventDay}. A probabilidade é de ${nextEventProb}% por volta de ${nextEventTime}.'
                ]), ctx)
            });
        } else if (temp <= 5) {
            insights.push({
                icon: '🧥', category: 'Saúde', title: 'Frio Extremo',
                message: this.interpolate(this.getRandom([
                    'Risco de hipotermia! A temperatura de ${temp}°C em ${city} exige roupas térmicas.',
                    'Frio muito intenso. Proteja-se bem e evite exposição prolongada ao ar livre.'
                ]), ctx)
            });
        } else if (uv >= 6 && solarStatus === 'Dia') {
            insights.push({
                icon: '🧴', category: 'Saúde', title: 'Proteção UV',
                message: this.interpolate(this.getRandom(this.templates.SAUDE.uv_high), ctx)
            });
        } else if (humidity < 30) {
            insights.push({
                icon: '🌵', category: 'Saúde', title: 'Ar Muito Seco',
                message: this.interpolate(this.getRandom(this.templates.SAUDE.dry_air), ctx)
            });
        } else {
            insights.push({
                icon: '🌿', category: 'Saúde', title: 'Bem-Estar',
                message: this.interpolate(this.getRandom(this.templates.SAUDE.mild), ctx)
            });
        }

        // 3. RESOLVER DICA (Sempre para fechar)
        const dicaExtra = pop > 0 && pop < 40 ?
            'A chance de chuva hoje é baixa (${pop}%), mas o clima pode mudar.' :
            'Aproveite a Lua ${moon} para planejar sua semana em ${city}.';

        const dicaTitles = ['Sugestão', 'Dica Valiosa', 'Se Liga', 'Presta Atenção', 'Pega a Visão', 'Fica a Dica', 'Anota Aí'];

        insights.push({
            icon: '💡',
            category: 'Dica',
            title: this.getRandom(dicaTitles),
            message: this.interpolate(this.getRandom([...this.templates.DICA, dicaExtra]), ctx)
        });

        return { insights: insights.slice(0, 3) };
    },

    interpolate(str, ctx) {
        return str.replace(/\${(\w+)}/g, (match, key) => (ctx[key] !== undefined && ctx[key] !== null) ? ctx[key] : match);
    }
};

// Exportar para o escopo global
window.generateLocalFallbackInsights = (current, forecast, aqi) => FALLBACK_ENGINE.generate(current, forecast, aqi);
