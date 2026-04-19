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

    getWeightedRandom(arr, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        for (let i = 0; i < arr.length; i++) {
            if (random < weights[i]) return arr[i];
            random -= weights[i];
        }
        return arr[arr.length - 1];
    },

    combineTemplates(templates, count = 2) {
        const selected = [];
        const pool = [...templates];
        
        const firstIdx = Math.floor(Math.random() * pool.length);
        selected.push(pool.splice(firstIdx, 1)[0]);

        if (count > 1 && pool.length > 0) {
            const hasCity = selected[0].includes('${city}');
            const hasTemp = selected[0].includes('${temp}');
            
            let filteredPool = pool.filter(t => {
                if (hasCity && t.includes('${city}')) return false;
                if (hasTemp && t.includes('${temp}')) return false;
                return true;
            });

            const finalPool = filteredPool.length > 0 ? filteredPool : pool;
            const secondIdx = Math.floor(Math.random() * finalPool.length);
            selected.push(finalPool[secondIdx]);
        }

        return selected.join(' ');
    },

    // 2. BIBLIOTECA DE TEMPLATES (ULTRA-MASSIVA)
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
                "Clima tropical raiz em ${city}: calor de ${temp}°C e umidade de ${humidity}%.",
                "O sol não dá trégua em ${city} com ${temp}°C.",
                "Calor intenso registrado nesta ${period} de ${season}.",
                "Sensação de mormaço predomina sob um céu de ${desc}.",
                "Termômetros batendo ${temp}°C agora.",
                "Clima de ${season} puro tomando conta da região.",
                "O asfalto ferve enquanto registramos ${temp}°C.",
                "Dia de derreter! Proteja-se do sol forte.",
                "Abafamento constante com umidade em ${humidity}%.",
                "Sombra e água fresca são essenciais neste momento."
            ],
            cold: [
                "Clima gelado em ${city}! Faz ${temp}°C nesta ${period} de ${season}.",
                "${city} tem uma ${period} de ${season} bem fria com apenas ${temp}°C.",
                "O frio chegou com tudo em ${city}: ${temp}°C registrados e ${desc}.",
                "Ideal para um café: ${city} registra ${temp}°C sob um céu de ${desc}.",
                "Blusa reforçada em ${city}! Termômetros em ${temp}°C nesta ${period} de ${season}.",
                "Inverno rigoroso em ${city}: apenas ${temp}°C registrados.",
                "O vento frio corta ${city} hoje. Faz ${temp}°C com ${desc}.",
                "Clima gelado em ${city}! Faz apenas ${temp}°C.",
                "O frio chegou com tudo nesta ${period} de ${season}.",
                "Ideal para um café enquanto os termômetros marcam ${temp}°C.",
                "Vento frio corta a cidade sob um céu de ${desc}.",
                "Prepare o casaco reforçado para encarar esses ${temp}°C.",
                "Friaca braba atingindo a região agora.",
                "Ar polar sobre ${city} derruba a temperatura.",
                "A sensação térmica parece ainda menor que ${temp}°C.",
                "Tempo firme mas muito frio nesta ${period}."
            ],
            snow: [
                "Neve em ${city}! Um espetáculo raro com ${temp}°C.",
                "Cenário de filme: flocos caindo e temperatura em ${temp}°C.",
                "Tudo branco lá fora nesta ${period} glacial.",
                "Inverno mágico transformando a paisagem.",
                "Frio extremo acompanhado de precipitação de neve."
            ],
            mild: [
                "${city} tem uma ${period} de ${season} agradável. Faz ${temp}°C com ${desc}.",
                "Clima ameno e confortável em ${city} hoje: ${temp}°C e ${desc}.",
                "Uma ${period} tranquila em ${city}! A temperatura está em ${temp}°C.",
                "Tempo bom em ${city}! ${temp}°C ideais para circular ao ar livre.",
                "${city} registra ${temp}°C nesta ${period} de ${season}. Condição de ${desc}.",
                "${city} tem uma ${period} muito agradável com ${temp}°C.",
                "Clima ameno e confortável sob um céu de ${desc}.",
                "Uma ${period} tranquila com temperatura em ${temp}°C.",
                "Tempo bom para circular ao ar livre agora.",
                "Frescor de ${season} trazendo equilíbrio térmico.",
                "Dia de luz suave e temperatura na medida.",
                "Nem casaco, nem ventilador: os ${temp}°C estão ideais.",
                "Aproveite este equilíbrio térmico em ${city}."
            ],
            rain: [
                "Tempo instável em ${city} com ${temp}°C e ${desc}.",
                "Chuva refresca o ar nesta ${period} de ${season}.",
                "O clima pede atenção devido ao ${desc} registrado.",
                "Dia molhado com umidade em ${humidity}%.",
                "Guarda-chuva à mão enquanto faz ${temp}°C.",
                "Precipitação constante trazendo frescor à região.",
                "O som da chuva domina esta ${period} em ${city}.",
                "Refresco vindo do céu baixa o calor para ${temp}°C.",
                "Solo molhado e temperatura amena agora.",
                "Clima de interior com aquele cheirinho de terra molhada."
            ],
            storm: [
                "Alerta de tempestade em ${city}! Cuidado com ${desc}.",
                "Tempo severo com ventos de ${wind}km/h.",
                "Raios e trovões marcam esta ${period} de ${temp}°C.",
                "Céu perigoso e instabilidade extrema atingindo a região.",
                "Procure abrigo seguro até a tempestade passar."
            ],
            cloudy: [
                "Céu encoberto em ${city} com ${temp}°C.",
                "Tapete de nuvens cinzas domina o horizonte agora.",
                "O sol se esconde nesta ${period} nublada.",
                "Luz difusa e clima estável na região.",
                "Dia opaco com ventos de ${wind}km/h e ${desc}."
            ],
            fog: [
                "Névoa densa em ${city} reduzindo a visibilidade.",
                "Clima misterioso envolvendo a paisagem com ${temp}°C.",
                "Atenção ao dirigir: neblina forte nesta ${period}.",
                "Ar úmido e visibilidade curta marcam o momento."
            ],
            windy: [
                "Ventania em ${city}! Rajadas de ${wind}km/h registradas.",
                "Segure o chapéu: o ar está em movimento intenso.",
                "Dia de ventos fortes soprando sob um céu de ${desc}.",
                "A ventania refresca (ou gela) a ${period} em ${city}."
            ],
            hail: [
                "Granizo em ${city}! Pedras de gelo caindo agora.",
                "Fenômeno intenso e raro com temperatura em ${temp}°C.",
                "Alerta de granizo: proteja janelas e veículos imediatamente."
            ]
        },
        SAUDE: {
            dry_air: [
                "Ar muito seco (${humidity}%). Hidrate-se constantemente!",
                "Umidade baixa dificulta a respiração. Beba água agora.",
                "Cuidado com as vias aéreas: a umidade está crítica em ${city}.",
                "Proteja-se do ressecamento: tome água mesmo sem sede."
            ],
            uv_high: [
                "Índice UV ${uv} (${uv_level}). Use protetor solar e acessórios.",
                "Sol forte em ${city}! Evite exposição direta até o fim da tarde.",
                "Fator de proteção obrigatório em ${city}. Índice UV atingiu nível ${uv_level}.",
                "Cuidado redobrado com a pele sob este sol com UV ${uv}."
            ],
            aqi_bad: [
                "Qualidade do ar ruim. Evite atividades físicas externas.",
                "Ar poluído em ${city} hoje. Grupos sensíveis devem ter cautela.",
                "Partículas no ar atingem níveis preocupantes em ${city}.",
                "Proteja seus pulmões: o índice de poluição está alto."
            ],
            aqi_moderate: [
                "Qualidade do ar moderada em ${city}. Sensíveis podem sentir desconforto.",
                "Ar com nível médio de poluentes. Fique atento se tiver alergias.",
                "Condições do ar aceitáveis, mas não ideais para todos.",
                "Qualidade do ar regular hoje. Respire com moderação ao ar livre."
            ],
            mild: [
                "Umidade em ${humidity}%: equilíbrio favorável para sua saúde.",
                "Condições estáveis para o bem-estar físico hoje.",
                "Aproveite o frescor: o clima está confortável em ${city}.",
                "Momento de equilíbrio térmico e conforto respiratório."
            ],
            heat_stress: [
                "Calor excessivo! Evite esforços físicos sob o sol.",
                "Risco de insolação: ${temp}°C exigem hidratação constante.",
                "Atenção a idosos e crianças neste calorão de ${city}.",
                "Busque locais frescos e arejados para evitar exaustão."
            ],
            cold_respiratory: [
                "Frio intenso favorece gripes. Mantenha-se bem agasalhado.",
                "Ar gelado pode irritar as vias aéreas. Use proteção.",
                "Temperatura de ${temp}°C exige atenção com a respiração.",
                "Previna-se contra resfriados nesta mudança de tempo."
            ],
            rain_mobility: [
                "Chuva pode causar alagamentos em áreas baixas de ${city}.",
                "Piso escorregadio: caminhe com atenção redobrada.",
                "Trânsito lento previsto. Planeje sua rota com calma.",
                "Monitore o tempo antes de sair para evitar transtornos."
            ],
            ideal_outdoor: [
                "Condições perfeitas para atividades externas! Aproveite.",
                "Céu e temperatura alinhados para um momento ao ar livre.",
                "Parques e praças estão convidativos com esses ${temp}°C.",
                "Clima colabora para exercícios e passeios relaxantes."
            ]
        },
        HUMOR: {
            poetic: [
                "O céu de ${city} escreve poemas com tons de ${desc}.",
                "${season} dança ao som do vento nesta ${period} inspiradora.",
                "Nuvens contam histórias de ${temp}°C e horizontes serenos.",
                "Pintura viva no horizonte: ${city} exibe sua melhor luz agora.",
                "Como um quadro de ${season}, a paisagem sussurra tranquilidade."
            ],
            casual: [
                "E aí, ${city}! Bora curtir esses ${temp}°C ou prefere o modo sofá? 😄",
                "Resumo: ${desc}, ${temp}°C e aquela vibe clássica de ${season}.",
                "Se o clima fosse um meme, hoje seria nota 10 pela originalidade! 😂",
                "Status: ${temp}°C e vontade de um café (ou sorvete) em ${city}. ✅",
                "Previsão do humor: 100% de chances de um dia incrível por aqui."
            ],
            motivational: [
                "Cada ${period} é uma nova chance de brilhar em ${city}. Vamos!",
                "O clima de hoje é o cenário perfeito para seus grandes planos.",
                "Não espere o tempo ideal: você já tem ${temp}°C e disposição.",
                "A ${season} traz oportunidades de ${temp}°C para crescer e conquistar.",
                "Céu de ${desc} e coração de campeão: ${city} te espera hoje! 🌟"
            ]
        },
        DICA: [
            "Com ${temp}°C e umidade em ${humidity}%, beba bastante água para evitar desidratação.",
            "Bom momento para uma caminhada leve aproveitando o frescor.",
            "Considere levar um casaco: a temperatura pode cair logo mais.",
            "Com ${desc}, a visibilidade está reduzida. Dirija com atenção.",
            "Aproveite a ${period}! O clima de ${season} está inspirador hoje.",
            "Não esqueça o guarda-chuva: a umidade e o céu indicam mudança.",
            "Mantenha as janelas abertas para renovar o ar da casa.",
            "Ideal para atividades leves ao ar livre. Curta o momento.",
            "Dia perfeito para fotografar as paisagens de ${city} agora.",
            "Economize energia: o clima permite desligar o ar-condicionado.",
            "Prefira roupas de tecidos naturais para lidar com a umidade.",
            "Regue suas plantas no fim da tarde para melhor absorção.",
            "Mantenha-se hidratado mesmo sem sentir sede; seu corpo agradece.",
            "Evite áreas com árvores altas se houver rajadas de vento fortes.",
            "Aproveite para ler ou relaxar nesta ${period} tranquila.",
            "Verifique os pneus: mudanças de temperatura afetam a calibração."
        ]
    },

    // 3. FASE DA LUA
    getMoonPhase(date) {
        const lp = 2551443;
        const new_moon = new Date(1970, 0, 7, 20, 35, 0).getTime();
        const phase = ((date.getTime() - new_moon) % lp) / lp;
        if (phase < 0.06) return "Nova";
        if (phase < 0.19) return "Crescente Côncava";
        if (phase < 0.31) return "Quarto Crescente";
        if (phase < 0.44) return "Crescente Gibosa (mais da metade iluminada)";
        if (phase < 0.56) return "Cheia";
        if (phase < 0.69) return "Minguante Gibosa (mais da metade iluminada)";
        if (phase < 0.81) return "Quarto Minguante";
        if (phase < 0.94) return "Minguante Côncava";
        return "Nova";
    },

    // 4. FUNÇÃO PRINCIPAL
    generate(current, forecast, aqi) {
        if (!current || !current.main || !current.weather) return null;

        const city = current.name || 'sua região';
        const temp = Math.round(current.main.temp);
        const humidity = current.main.humidity;
        const wind = Math.round(current.wind.speed * 3.6);
        const desc = current.weather[0].description;
        const aqiVal = aqi?.list?.[0]?.main?.aqi || 1;
        const uv = current.uvi || 0;
        const clouds = current.clouds?.all || 0;
        const pop = forecast?.list?.[0]?.pop ? Math.round(forecast.list[0].pop * 100) : 0;
        const visibility = (current.visibility / 1000).toFixed(1);
        const pressure = current.main.pressure;
        const feels_like = Math.round(current.main.feels_like);
        const feels_diff = feels_like - temp;

        const timezone = current.timezone || 0;
        const localTimeEpoch = new Date().getTime() + (timezone * 1000) + (new Date().getTimezoneOffset() * 60000);
        const now = new Date(localTimeEpoch);
        const days = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
        const dayName = days[now.getDay()];
        const is_weekend = [0, 6].includes(now.getDay());
        const season = this.getSeason(current?.coord?.lat || 0, now.getMonth() + 1);
        const period = this.getTimeOfDay(now.getHours());
        const moon = this.getMoonPhase(now);

        let uv_level = 'baixo';
        if (uv >= 11) uv_level = 'extremo';
        else if (uv >= 8) uv_level = 'muito alto';
        else if (uv >= 6) uv_level = 'alto';
        else if (uv >= 3) uv_level = 'moderado';

        const sunrise = current.sys?.sunrise ? new Date(current.sys.sunrise * 1000) : null;
        const sunset = current.sys?.sunset ? new Date(current.sys.sunset * 1000) : null;
        const diffSunrise = sunrise ? Math.abs(now - sunrise) / 60000 : 999;
        const diffSunset = sunset ? Math.abs(now - sunset) / 60000 : 999;
        let solarStatus = (now > sunrise && now < sunset) ? 'Dia' : 'Noite';
        if (diffSunrise < 40) solarStatus = 'Amanhecer';
        else if (diffSunset < 40) solarStatus = 'Entardecer';

        const ctx = {
            city, temp, humidity, wind, desc, season, period, aqi: aqiVal, uv, pop, moon, clouds, solarStatus,
            feels_like, dayName, uv_level, visibility, pressure, feels_diff, is_weekend,
            feeling: temp >= 30 ? 'abafado' : temp <= 10 ? 'gelado' : 'agradável',
            sky_mood: clouds > 80 ? 'dramático' : clouds < 20 ? 'sereno' : 'equilibrado',
            activity_suggestion: temp >= 25 && pop < 20 ? 'clube ou piscina' : temp <= 15 ? 'cinema' : 'parque',
            humidity_tip: humidity > 60 ? 'cabelo frisado garantido' : 'hidratação ideal',
            food_tip: temp >= 25 ? 'água de coco' : temp <= 15 ? 'chocolate quente' : 'suco natural',
            wind_tip: wind > 20 ? 'esportes radicais' : 'um piquenique tranquilo',
            temp_record_diff: Math.abs(56.7 - temp).toFixed(1),
            evaporation_speed: humidity > 60 ? 'lenta' : 'rápida'
        };

        const insights = [];

        // 1. RESOLVER RESUMO (Ultra Dinâmico)
        let resumoGroup = 'mild';
        const d = desc.toLowerCase();
        if (d.includes('tempestade') || d.includes('trovão')) resumoGroup = 'storm';
        else if (d.includes('neve')) resumoGroup = 'snow';
        else if (d.includes('chuva') || d.includes('garoa')) resumoGroup = 'rain';
        else if (d.includes('nuvens') || d.includes('nublado')) resumoGroup = 'cloudy';
        else if (d.includes('névoa') || d.includes('neblina')) resumoGroup = 'fog';
        else if (d.includes('granizo')) resumoGroup = 'hail';
        else if (wind > 40) resumoGroup = 'windy';
        else if (temp >= 28) resumoGroup = 'heat';
        else if (temp <= 15) resumoGroup = 'cold';

        const icons = { rain: '🌧️', heat: '☀️', cold: '❄️', mild: '🌤️', storm: '⛈️', cloudy: '☁️', snow: '❄️☃️', fog: '🌫️', windy: '💨', hail: '🧊' };
        const titles = {
            rain: ['Céu Chuvoso', 'Águas de ${season}', '${dayName} chuvoso'],
            heat: ['Calor Intenso', 'Sol Radiante', '${dayName} ensolarado!'],
            cold: ['Frio Intenso', 'Clima Gelado', '${dayName} gelado'],
            mild: ['Tempo Bom', 'Céu Aberto', '${dayName} agradável'],
            storm: ['Alerta Máximo', 'Tempestade!', 'Céu Perigoso'],
            cloudy: ['Muitas Nuvens', 'Céu Cinzento', 'Tempo Nublado'],
            snow: ['Neve na Área', 'Alerta de Neve', 'Mundo Branco'],
            fog: ['Baixa Visibilidade', 'Manto de Névoa'],
            windy: ['Ventos Fortes', 'Rajadas Intensas'],
            hail: ['Alerta de Granizo', 'Chuva de Gelo']
        };

        const flavorPhrases = [
            '${city} tem um ${dayName} de ${desc} e ${temp}°C. Sensação de ${feels_like}°C.',
            'O horizonte exibe tons de ${desc} nesta ${period} de ${season}.',
            'Com a Lua ${moon}, a atmosfera de ${solarStatus} domina ${city}.',
            'Pressão estável em ${pressure}hPa com visibilidade de ${visibility}km.'
        ];

        // Análise Especial de Dados
        if (Math.abs(feels_diff) >= 3) {
            flavorPhrases.push(`A sensação térmica está ${feels_diff > 0 ? 'maior' : 'menor'} que a temperatura real (${feels_like}°C) devido ${humidity > 60 ? 'à umidade' : 'ao vento'}.`);
        }
        if (visibility < 5) {
            flavorPhrases.push(`Visibilidade reduzida em ${city} (${visibility}km). Atenção ao se deslocar.`);
        }
        if (is_weekend && temp >= 25 && pop < 20) {
            flavorPhrases.push(`Clima perfeito de final de semana em ${city}! Aproveite ao ar livre.`);
        }

        insights.push({
            icon: icons[resumoGroup] || '🌤️',
            category: 'Resumo',
            title: this.interpolate(this.getRandom(titles[resumoGroup] || ['Clima Agora']), ctx),
            message: this.interpolate(this.combineTemplates([...this.templates.RESUMO[resumoGroup], ...flavorPhrases], 2), ctx)
        });

        // 2. RESOLVER SEGUNDO INSIGHT (Saúde ou Vibe)
        const rand = Math.random();
        if (rand < 0.5) {
            let hG = 'mild';
            if (temp >= 32) hG = 'heat_stress';
            else if (temp <= 10) hG = 'cold_respiratory';
            else if (aqiVal >= 4) hG = 'aqi_bad';
            else if (aqiVal >= 2) hG = 'aqi_moderate';
            else if (uv >= 6) hG = 'uv_high';
            else if (pop > 50) hG = 'rain_mobility';
            else if (humidity < 30) hG = 'dry_air';
            insights.push({ icon: '🏥', category: 'Saúde', title: 'Bem-Estar', message: this.interpolate(this.getRandom(this.templates.SAUDE[hG] || this.templates.SAUDE.mild), ctx) });
        } else {
            const hT = this.getRandom(['poetic', 'casual', 'motivational']);
            insights.push({ icon: '✨', category: 'Vibe', title: 'Momento', message: this.interpolate(this.getRandom(this.templates.HUMOR[hT]), ctx) });
        }

        // 3. RESOLVER DICA
        insights.push({ icon: '💡', category: 'Dica', title: 'Sugestão', message: this.interpolate(this.getRandom(this.templates.DICA), ctx) });

        // 4. EASTER EGGS
        const easterEggs = [
            { icon: '🔮', msg: "Em ${city}, a Lua ${moon} influencia as marés e o nosso ritmo biológico." },
            { icon: '📊', msg: "${humidity}% de umidade indica que o ar em ${city} está ${humidity_tip}." },
            { icon: '🍽️', msg: "Para este clima de ${temp}°C, o ideal é consumir ${food_tip}." },
            { icon: '🧠', msg: "Ventos de ${wind}km/h em ${city} são perfeitos para ${wind_tip}." },
            { icon: '🌡️', msg: "O recorde de calor na Terra é 56.7°C. ${city} está ${temp_record_diff}°C abaixo disso." },
            { icon: '🔋', msg: "Temperaturas de ${temp}°C afetam a bateria do seu celular; evite o sol direto." },
            { icon: '💧', msg: "Com ${humidity}% de umidade, a evaporação do suor é mais ${evaporation_speed}." },
            { icon: '🛸', msg: "Curiosidade: Em Marte, a média é -62°C. Aqui em ${city} temos ${temp}°C." },
            { icon: '🧘', msg: "A sensação de ${feeling} é um convite para 5 minutos de meditação." },
            { icon: '🌳', msg: "Sabia? Árvores grandes evaporam até 400 litros de água em dias de ${temp}°C." },
            { icon: '🧊', msg: "A ${temp}°C, a água congela em 0°C. ${city} está longe disso hoje!" },
            { icon: '🌻', msg: "Girassóis seguem o sol, mas em dias de ${desc} eles se voltam uns para os outros." },
            { icon: '🚗', msg: "Dirigir com ${desc} exige atenção nos pneus devido à temperatura." }
        ];

        if (Math.random() > 0.66) {
            const egg = this.getRandom(easterEggs);
            insights.push({ icon: egg.icon, category: 'Curiosidade', title: 'Você Sabia?', message: this.interpolate(egg.msg, ctx) });
        }

        return { insights: insights.slice(0, 4) };
    },

    interpolate(str, ctx) {
        return str.replace(/\${(\w+)}/g, (match, key) => (ctx[key] !== undefined && ctx[key] !== null) ? ctx[key] : match);
    }
};

// Exportar para o escopo global
window.generateLocalFallbackInsights = (current, forecast, aqi) => FALLBACK_ENGINE.generate(current, forecast, aqi);
