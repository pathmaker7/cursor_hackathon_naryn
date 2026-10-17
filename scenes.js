// The ten decisions. Pure content: every question quotes live stats, every choice carries hidden consequences (fx).
// Each scene offers three radical choices tagged by archetype (see ARCH in data.js):
//   tech   = technology and growth first, nature pays.
//   nature = nature first, technology and the economy pay.
//   sync   = SolarPunk coexistence: technology that serves nature. It is never free: debt and slow gains pile up.
// The order of the three choices differs from scene to scene, and titles never reveal the archetype.
// Echoes are shown after a click and again at the start of the next question, so each one leads into the next topic.

export const SCENES = [
  // 1. Winter power: [nature, tech, sync]
  {
    topic: { en: 'Winter power', ru: 'Зимняя энергия' },
    q: {
      en: s => `Winter again: the Toktogul reservoir runs low and blackouts return. Energy independence is ${s.energy}%, technology is ${s.tech}, nature is ${s.nature}/100 and debt is ${s.debt}% of GDP. How do you keep the lights on?`,
      ru: s => `Снова зима: Токтогульское водохранилище мелеет, отключения возвращаются. Энергонезависимость ${s.energy}%, технологии ${s.tech}, природа ${s.nature}/100, долг ${s.debt}% ВВП. Как вернуть свет в дома?`,
    },
    choices: [
      { arch: 'nature', fx: { nature: 9, energy: 0, tech: -3, economy: -5, poverty: 3, happiness: 2 },
        title: { en: 'Rooftop solar and micro-hydro on every village stream', ru: 'Солнечные крыши и микро-ГЭС на каждом сельском ручье' },
        sub: { en: 'Small, local and gentle on the valleys, but slow to grow.', ru: 'Небольшие местные станции, бережные к долинам, но растут медленно.' },
        echo: { en: 'Panels appear on village roofs and small turbines spin in the streams, yet the lights still flicker. In Bishkek, coal smoke thickens.', ru: 'На крышах появляются панели, в ручьях крутятся маленькие турбины, но свет всё ещё мигает. В Бишкеке густеет угольный дым.' } },
      { arch: 'tech', fx: { energy: 16, economy: 7, tech: 5, nature: -6, debt: 24, happiness: -3, literacy: -5 },
        title: { en: 'Sign the Kambarata-1 megadam loan', ru: 'Подписать кредит на плотину Камбарата-1' },
        sub: { en: 'The biggest power plant Kyrgyzstan has planned, paid for by foreign lenders.', ru: 'Крупнейшая запланированная электростанция Кыргызстана на деньги иностранных кредиторов.' },
        echo: { en: 'Cranes rise on the Naryn and the grid steadies, but the first invoice is in the mail. Bishkek still burns coal.', ru: 'На Нарыне растут краны, сеть стабилизируется, но первый счёт уже в пути. Бишкек всё ещё топит углём.' } },
      { arch: 'sync', fx: { tech: 7, nature: 5, energy: 9, economy: -5, debt: 21, happiness: -2 },
        title: { en: 'Solar-plus-storage micro-grids for the villages', ru: 'Солнечные микросети с накопителями для сёл' },
        sub: { en: 'Panels, batteries and smart meters that keep each valley powered through the winter.', ru: 'Панели, батареи и умные счётчики, которые держат свет в каждой долине всю зиму.' },
        echo: { en: 'Village grids hold through the coldest nights, and the first batteries are paid for with loans. In Bishkek the winter air stays heavy.', ru: 'Сельские сети держатся в самые холодные ночи, первые батареи куплены в кредит. В Бишкеке зимний воздух остаётся тяжёлым.' } },
    ],
  },
  // 2. Smog and transport: [sync, nature, tech]
  {
    topic: { en: 'Smog and transport', ru: 'Смог и транспорт' },
    q: {
      en: s => `Winter smog sits over Bishkek like a lid, fed by coal stoves and old buses. Nature is ${s.nature}/100, technology is ${s.tech}, happiness is ${s.happiness} and debt is ${s.debt}% of GDP. How do you clear the air?`,
      ru: s => `Зимний смог лежит над Бишкеком, как крышка: его дают угольные печи и старые автобусы. Природа ${s.nature}/100, технологии ${s.tech}, счастье ${s.happiness}, долг ${s.debt}% ВВП. Как очистить воздух?`,
    },
    choices: [
      { arch: 'sync', fx: { tech: 6, nature: 5, energy: 4, economy: -5, debt: 20, happiness: -2 },
        title: { en: 'Electric buses and used EVs, charged at solar stations', ru: 'Электробусы и подержанные электромобили с зарядкой от солнца' },
        sub: { en: 'Clean rides for the city, with charging points built by the state.', ru: 'Чистый транспорт для города, зарядные станции строит государство.' },
        echo: { en: 'Electric buses glide through a clearer city. Up in the mountains, the snow that feeds the rivers keeps shrinking.', ru: 'Электробусы скользят по более чистому городу. В горах снег, питающий реки, продолжает таять.' } },
      { arch: 'nature', fx: { nature: 9, energy: -7, tech: -4, economy: -6, happiness: -4, poverty: 2 },
        title: { en: 'Ban coal stoves and cars in the centre, bring back rail and bikes', ru: 'Запретить угольные печи и машины в центре, вернуть рельсы и велосипеды' },
        sub: { en: 'The air clears quickly, but the city must manage without new machines.', ru: 'Воздух быстро очищается, но городу приходится обходиться без новой техники.' },
        echo: { en: 'The air clears and lungs breathe easier, but commutes are long and shops go quiet. In the mountains the glaciers keep melting.', ru: 'Воздух очищается, дышать легче, но дорога на работу долгая, а магазины пустеют. В горах ледники продолжают таять.' } },
      { arch: 'tech', fx: { economy: 8, energy: 6, tech: 3, nature: -8, debt: 12, happiness: -4, literacy: -5 },
        title: { en: 'Cheap coal heat plants and a ring of new highways', ru: 'Дешёвые угольные котельные и новые кольцевые магистрали' },
        sub: { en: 'Fast fixes for heat and traffic that leave smoke hanging over the city.', ru: 'Быстрые решения для тепла и пробок, после которых над городом остаётся дым.' },
        echo: { en: 'Highways open and the city moves faster, while soot darkens the glaciers above it. The rivers will pay for that.', ru: 'Магистрали открыты, город движется быстрее, а сажа чернит ледники над ним. За это заплатят реки.' } },
    ],
  },
  // 3. Water and glaciers: [nature, sync, tech]
  {
    topic: { en: 'Water and glaciers', ru: 'Вода и ледники' },
    q: {
      en: s => `The glaciers shrink every year, and the rivers that feed fields and turbines turn erratic. Nature is ${s.nature}/100, energy independence is ${s.energy}%, technology is ${s.tech} and debt is ${s.debt}% of GDP. How do you secure the water?`,
      ru: s => `Ледники тают с каждым годом, а реки, которые питают поля и турбины, становятся капризными. Природа ${s.nature}/100, энергонезависимость ${s.energy}%, технологии ${s.tech}, долг ${s.debt}% ВВП. Как обеспечить воду?`,
    },
    choices: [
      { arch: 'nature', fx: { nature: 10, economy: -5, tech: -3, energy: -6, culture: 2 },
        title: { en: 'Replant mountain forests and restore the wetlands', ru: 'Посадить горные леса и вернуть болота и поймы' },
        sub: { en: 'Let the land hold the water, and wait for the rivers to settle.', ru: 'Пусть земля сама удерживает воду, а реки успокоятся со временем.' },
        echo: { en: 'Young trees and wetlands slow the runoff and the rivers run steadier, though fields stay thirsty. Meanwhile families look abroad for work.', ru: 'Молодые леса и болота замедляют сток, реки текут ровнее, но поля остаются сухими. А семьи всё чаще ищут работу за границей.' } },
      { arch: 'sync', fx: { tech: 7, nature: 5, economy: -5, energy: 2, debt: 19, happiness: -1 },
        title: { en: 'Smart irrigation: soil sensors, drip lines and weather forecasts', ru: 'Умный полив: датчики почвы, капельные линии и прогноз погоды' },
        sub: { en: 'Every drop is measured and goes to the root, paid for by a loan.', ru: 'Каждая капля учтена и идёт к корню, а платить придётся кредитом.' },
        echo: { en: 'Sensors guide each drop to the roots and harvests hold, but there are few new jobs. Young people still look abroad for work.', ru: 'Датчики ведут каждую каплю к корням, урожаи держатся, но новых рабочих мест мало. Молодёжь по-прежнему ищет работу за границей.' } },
      { arch: 'tech', fx: { energy: 9, economy: 8, tech: 4, nature: -9, debt: 20, culture: -3, literacy: -5 },
        title: { en: 'Build a cascade of dams and concrete canals', ru: 'Построить каскад плотин и бетонных каналов' },
        sub: { en: 'Total control of the rivers, at the cost of the valleys beneath.', ru: 'Полный контроль над реками ценой долин, которые уйдут под воду.' },
        echo: { en: 'Concrete tames the rivers, but flooded fields leave villages empty. Many families now look abroad for work.', ru: 'Бетон укрощает реки, но затопленные поля опустошают сёла. Многие семьи теперь ищут работу за границей.' } },
    ],
  },
  // 4. Jobs and migration: [tech, sync, nature]
  {
    topic: { en: 'Jobs and migration', ru: 'Работа и миграция' },
    q: {
      en: s => `Money wired home by workers abroad is roughly a fifth of GDP, and the young keep leaving. Poverty is ${s.poverty}%, technology is ${s.tech}, the economy scores ${s.economy} and nature is ${s.nature}/100. What gives them a reason to stay?`,
      ru: s => `Деньги от мигрантов составляют около пятой части ВВП, а молодёжь продолжает уезжать. Бедность ${s.poverty}%, технологии ${s.tech}, экономика ${s.economy}, природа ${s.nature}/100. Что заставит людей остаться?`,
    },
    choices: [
      { arch: 'tech', fx: { economy: 12, tech: 5, poverty: -6, nature: -7, happiness: -5, literacy: -10 },
        title: { en: 'Open a free zone for foreign factories', ru: 'Открыть свободную зону для иностранных заводов' },
        sub: { en: 'Fast jobs and cheap labor, with few rules for air or water.', ru: 'Быстрые рабочие места и дешёвый труд, почти без правил для воздуха и воды.' },
        echo: { en: 'Chimneys rise outside Bishkek and shifts run long. Teenagers drift from classrooms to the assembly line.', ru: 'Дымят трубы у Бишкека, смены длинные. Подростки уходят из классов к конвейеру.' } },
      { arch: 'sync', fx: { tech: 8, nature: 4, economy: -2, poverty: -3, debt: 19, happiness: -2 },
        title: { en: 'Green-tech workshops: solar assembly, e-bike repair, drone mapping', ru: 'Мастерские зелёных технологий: солнечные панели, электровелосипеды, дроны' },
        sub: { en: 'Skilled local jobs that need training and start-up loans.', ru: 'Квалифицированная работа дома, для которой нужны обучение и стартовые кредиты.' },
        echo: { en: 'Workshops hum in Osh and Naryn and the first technicians stay home. Employers now ask the schools for digital skills.', ru: 'Мастерские гудят в Оше и Нарыне, первые техники остаются дома. Работодатели теперь ждут от школ цифровых навыков.' } },
      { arch: 'nature', fx: { nature: 8, culture: 7, happiness: 3, economy: -5, tech: -4, energy: -4 },
        title: { en: 'Revive felt, wool and honey crafts in every village', ru: 'Возродить войлок, шерсть и мёд в каждом селе' },
        sub: { en: 'Small cooperatives that keep families together and leave the land untouched.', ru: 'Небольшие кооперативы, которые сохраняют семьи и не трогают землю.' },
        echo: { en: 'Felt and honey cooperatives keep families together, though wages stay modest. Few children learn to code.', ru: 'Кооперативы войлока и мёда сохраняют семьи, хотя зарплаты скромные. Мало кто из детей учится программировать.' } },
    ],
  },
  // 5. Schools and digital skills: [sync, tech, nature]
  {
    topic: { en: 'Schools and skills', ru: 'Школы и навыки' },
    q: {
      en: s => `Literacy is ${s.literacy}%, but new jobs ask for digital skills and many village schools have none. Technology is ${s.tech}, debt is ${s.debt}% of GDP and happiness is ${s.happiness}. Where does the education money go?`,
      ru: s => `Грамотность ${s.literacy}%, но новые профессии требуют цифровых навыков, а во многих сельских школах их не учат. Технологии ${s.tech}, долг ${s.debt}% ВВП, счастье ${s.happiness}. Куда пойдут деньги на образование?`,
    },
    choices: [
      { arch: 'sync', fx: { tech: 7, nature: 4, literacy: 2, energy: 2, economy: -5, debt: 20, happiness: -2 },
        title: { en: 'Solar-powered e-learning hubs in every village', ru: 'Школьные цифровые центры на солнечной энергии в каждом селе' },
        sub: { en: 'Satellite internet, tablets and teachers trained to teach with them.', ru: 'Спутниковый интернет, планшеты и учителя, обученные работать с ними.' },
        echo: { en: 'Village pupils study by solar light and the loan is booked. Meanwhile travel agents ask how to bring guests to the mountains.', ru: 'Сельские школьники учатся при солнечном свете, кредит уже записан. А турагентства спрашивают, как привезти гостей в горы.' } },
      { arch: 'tech', fx: { tech: 9, economy: 4, literacy: -4, nature: -6, debt: 22, energy: -3 },
        title: { en: 'A laptop for every pupil and imported glass campuses', ru: 'Ноутбук каждому ученику и импортные стеклянные кампусы' },
        sub: { en: 'Impressive buildings and the latest devices, financed by a loan.', ru: 'Впечатляющие здания и новейшие устройства, оплаченные кредитом.' },
        echo: { en: 'Glass campuses open to applause, then the loan payments start. Hotel developers are already eyeing the lake shore.', ru: 'Стеклянные кампусы открываются под аплодисменты, затем начинаются платежи. Застройщики уже смотрят на берег озера.' } },
      { arch: 'nature', fx: { nature: 8, culture: 7, literacy: 2, tech: -5, economy: -4, happiness: 2, energy: -4 },
        title: { en: 'Forest schools: crafts, ecology and rangers, no screens', ru: 'Лесные школы: ремёсла, экология и егеря, без экранов' },
        sub: { en: 'Children learn from the land and the elders, not from computers.', ru: 'Дети учатся у земли и старших, а не у компьютеров.' },
        echo: { en: 'Pupils learn crafts and ecology outdoors, but digital skills lag behind. Visitors keep arriving at the lake, and the beaches fill.', ru: 'Ученики осваивают ремёсла и экологию на воздухе, но цифровые навыки отстают. А у озера тем временем всё больше гостей.' } },
    ],
  },
  // 6. Tourism: [nature, tech, sync]
  {
    topic: { en: 'Tourism', ru: 'Туризм' },
    q: {
      en: s => `Issyk-Kul beaches and Tian Shan trails draw more visitors every summer. Tourism is ${s.tourism}, nature is ${s.nature}/100, technology is ${s.tech} and the economy scores ${s.economy}. How do you welcome the guests?`,
      ru: s => `Пляжи Иссык-Куля и тропы Тянь-Шаня привлекают всё больше гостей каждое лето. Туризм ${s.tourism}, природа ${s.nature}/100, технологии ${s.tech}, экономика ${s.economy}. Как принять гостей?`,
    },
    choices: [
      { arch: 'nature', fx: { nature: 10, tourism: -6, economy: -5, tech: -3, culture: 3, poverty: 2, energy: -4 },
        title: { en: 'Cap the trails and ban new building on the shore', ru: 'Ограничить тропы и запретить новую застройку на берегу' },
        sub: { en: 'Fewer guests, a quiet lake and untouched pastures.', ru: 'Меньше гостей, тихое озеро и нетронутые пастбища.' },
        echo: { en: 'Quiet trails keep the lake clean, though guest houses earn little. Investors point to the gold and rare earths under a glacier.', ru: 'Тихие тропы сохраняют озеро чистым, хотя гостевые дома зарабатывают мало. Инвесторы указывают на золото и редкоземельные металлы под ледником.' } },
      { arch: 'tech', fx: { tourism: 14, economy: 11, tech: 3, nature: -9, debt: 14, culture: -5, literacy: -5 },
        title: { en: 'Mega resorts, cable cars and an international airport', ru: 'Мегакурорты, канатные дороги и международный аэропорт' },
        sub: { en: 'Mass tourism and fast money for the lake and its investors.', ru: 'Массовый туризм и быстрые деньги для озера и его инвесторов.' },
        echo: { en: 'Hotels crowd the shore and the water clouds. Then investors ask what lies in the rock under the glacier.', ru: 'Отели теснятся на берегу, вода мутнеет. Тогда инвесторы спрашивают, что лежит в скале под ледником.' } },
      { arch: 'sync', fx: { tourism: 5, tech: 6, nature: 5, economy: -2, debt: 19, happiness: -2 },
        title: { en: 'Eco-tourism: app booking, visitor caps and solar yurt camps', ru: 'Экотуризм: бронь в приложении, лимиты гостей и юртовые лагеря на солнечной энергии' },
        sub: { en: 'A limited number of guests, booked online, sleeping in yurts powered by the sun.', ru: 'Ограниченное число гостей, бронь онлайн, ночлег в юртах на солнечной энергии.' },
        echo: { en: 'Solar yurts fill without crowding the pastures. Then geologists confirm gold and rare earths under a glacier.', ru: 'Солнечные юрты заполняются, а пастбища остаются нетронутыми. Затем геологи подтверждают золото и редкоземельные металлы под ледником.' } },
    ],
  },
  // 7. Gold and rare earths: [tech, sync, nature]
  {
    topic: { en: 'Gold and rare earths', ru: 'Золото и редкоземельные металлы' },
    q: {
      en: s => `Surveys find gold and rare earths under a glacier, the metals inside every turbine and phone. Nature is ${s.nature}/100, the economy scores ${s.economy}, technology is ${s.tech} and debt is ${s.debt}% of GDP. What happens to the mountain?`,
      ru: s => `Геологи нашли золото и редкоземельные металлы под ледником, те самые, что есть в каждой турбине и телефоне. Природа ${s.nature}/100, экономика ${s.economy}, технологии ${s.tech}, долг ${s.debt}% ВВП. Что будет с горой?`,
    },
    choices: [
      { arch: 'tech', fx: { economy: 12, tech: 4, energy: 3, nature: -10, happiness: -4, tourism: -5, literacy: -5 },
        title: { en: 'Open an open-pit mine under the glacier', ru: 'Открыть карьер под ледником' },
        sub: { en: 'Exports and jobs right away, but dust on the ice and poisoned streams.', ru: 'Экспорт и работа сразу, но пыль на льду и отравленные ручьи.' },
        echo: { en: 'Trucks roll and the glacier greys with dust. Now the lenders ask when the loans will be repaid.', ru: 'Грузовики идут, ледник сереет от пыли. Теперь кредиторы спрашивают, когда будут возвращены займы.' } },
      { arch: 'sync', fx: { tech: 7, nature: 5, economy: -5, energy: 2, debt: 20, happiness: -2 },
        title: { en: 'Urban mining: recycle e-waste and scrap, watch the glacier by satellite', ru: 'Городская добыча: переработка электроники и лома, спутниковый надзор за ледником' },
        sub: { en: 'Metals come from old phones and scrap yards, and the mountain stays shut.', ru: 'Металлы берут из старых телефонов и лома, а гора остаётся закрытой.' },
        echo: { en: 'Recycling plants pull metal from old phones and scrap. Lenders now arrive with the accounts open on the table.', ru: 'Заводы вторсырья достают металл из старых телефонов и лома. Кредиторы теперь приходят с выставленными счетами.' } },
      { arch: 'nature', fx: { nature: 12, tourism: 3, tech: -4, economy: -6, culture: 2, poverty: 3, energy: -4 },
        title: { en: 'Make the mountain a national park, closed to mining', ru: 'Сделать гору национальным парком, закрытым для добычи' },
        sub: { en: 'The glacier stays white, but a country without new income must wait.', ru: 'Ледник остаётся белым, а стране без нового дохода придётся ждать.' },
        echo: { en: 'The glacier stays white and the mountain silent. Lenders ask how a country without new income will repay.', ru: 'Ледник остаётся белым, гора молчит. Кредиторы спрашивают, как страна без новых доходов будет платить.' } },
    ],
  },
  // 8. Debt reckoning: [nature, sync, tech]
  {
    topic: { en: 'Debt reckoning', ru: 'Час расплаты' },
    q: {
      en: s => `The creditors want a plan. Debt is ${s.debt}% of GDP, the economy scores ${s.economy}, technology is ${s.tech} and nature is ${s.nature}/100. How do you settle the accounts?`,
      ru: s => `Кредиторы требуют план. Долг ${s.debt}% ВВП, экономика ${s.economy}, технологии ${s.tech}, природа ${s.nature}/100. Как рассчитаться по счетам?`,
    },
    choices: [
      { arch: 'nature', fx: { debt: -10, nature: 9, economy: -6, tech: -4, poverty: 3, energy: -4 },
        title: { en: 'Swap part of the debt for forest protection', ru: 'Обменять часть долга на охрану лесов' },
        sub: { en: 'The debt shrinks, but the money is tied to parks, not to factories.', ru: 'Долг сокращается, но деньги привязаны к паркам, а не к заводам.' },
        echo: { en: 'Forests are protected and the debt eases, but the budget is thin. Crypto miners come knocking for cheap hydropower.', ru: 'Леса под охраной, долг уменьшается, но бюджет скудный. Криптомайнеры стучатся за дешёвой гидроэнергией.' } },
      { arch: 'sync', fx: { debt: 2, tech: 6, nature: 5, energy: 3, economy: -7, happiness: -2 },
        title: { en: 'Issue green bonds to finance solar and digital projects', ru: 'Выпустить зелёные облигации на солнечные и цифровые проекты' },
        sub: { en: 'Investors lend at fair rates, so the debt barely moves.', ru: 'Инвесторы дают деньги по честной ставке, поэтому долг почти не меняется.' },
        echo: { en: 'Green bonds find buyers and the debt stays level. Meanwhile the world\'s data centers go looking for cold, clean countries.', ru: 'Зелёные облигации находят покупателей, долг почти не растёт. А мировые дата-центры ищут холодные и чистые страны.' } },
      { arch: 'tech', fx: { debt: -20, economy: 6, tech: 5, nature: -7, happiness: -5, culture: -3, literacy: -5 },
        title: { en: 'Sell shares in power plants and mines to foreign tech firms', ru: 'Продать доли в электростанциях и рудниках иностранным технологическим компаниям' },
        sub: { en: 'The debt falls fast, and the new owners write the rules.', ru: 'Долг быстро падает, а правила теперь диктуют новые владельцы.' },
        echo: { en: 'The books balance and foreign firms take over the grid. They offer to turn the country into a data hub.', ru: 'Бухгалтерия сходится, а иностранные фирмы берут сеть. Они предлагают сделать страну центром данных.' } },
    ],
  },
  // 9. AI and data centers: [tech, nature, sync]
  {
    topic: { en: 'AI and data centers', ru: 'ИИ и дата-центры' },
    q: {
      en: s => `Data centers and AI need cheap power and cold air, and your mountains have both. Technology is ${s.tech}, energy independence is ${s.energy}%, nature is ${s.nature}/100 and debt is ${s.debt}% of GDP. What kind of digital country will you be?`,
      ru: s => `Дата-центрам и ИИ нужны дешёвая энергия и холодный воздух, а в ваших горах есть и то и другое. Технологии ${s.tech}, энергонезависимость ${s.energy}%, природа ${s.nature}/100, долг ${s.debt}% ВВП. Какой цифровой страной вы станете?`,
    },
    choices: [
      { arch: 'tech', fx: { economy: 11, tech: 8, energy: -10, nature: -7, happiness: -4, literacy: -5 },
        title: { en: 'Open the grid to crypto farms and unrestricted AI hosting', ru: 'Открыть сеть для крипто-ферм и ИИ без ограничений' },
        sub: { en: 'Foreign money pours in while the rigs run hot day and night.', ru: 'Иностранные деньги текут рекой, а установки работают днём и ночью.' },
        echo: { en: 'Rigs run hot day and night and the warm summer melts the ice faster. Then scouts report a glacial lake full to the brim.', ru: 'Установки работают днём и ночью, а тёплое лето ускоряет таяние льда. Затем разведчики сообщают о ледниковом озере, полном до краёв.' } },
      { arch: 'nature', fx: { nature: 8, tech: -6, economy: -5, culture: 3, happiness: -2, energy: -4 },
        title: { en: 'Ban crypto and data centers, stay analog', ru: 'Запретить крипту и дата-центры, остаться аналоговыми' },
        sub: { en: 'The rivers and the power belong to people, not to servers.', ru: 'Реки и энергия принадлежат людям, а не серверам.' },
        echo: { en: 'The valleys stay quiet, but the country has few instruments to watch the sky. Then a glacial lake swells above a village.', ru: 'Долины остаются тихими, но у страны мало приборов, чтобы следить за небом. Затем над селом набухает ледниковое озеро.' } },
      { arch: 'sync', fx: { tech: 8, nature: 4, energy: 2, economy: -1, debt: 21, happiness: -2 },
        title: { en: 'A green data center on the cold plateau, run by hydro and solar', ru: 'Зелёный дата-центр на холодном плато на гидро- и солнечной энергии' },
        sub: { en: 'Its waste heat warms nearby homes and replaces their coal stoves.', ru: 'Его тепло отапливает соседние дома и заменяет им угольные печи.' },
        echo: { en: 'Servers hum in the cold and warm the homes nearby. Then satellites show a glacial lake swollen to the brim above a valley.', ru: 'Серверы гудят на холоде и греют ближайшие дома. Затем спутники показывают ледниковое озеро, переполненное над долиной.' } },
    ],
  },
  // 10. The glacial lake flood: [nature, tech, sync]
  {
    topic: { en: 'The flood', ru: 'Паводок' },
    q: {
      en: s => `A glacial lake above a valley is about to burst, and thousands of homes lie below it. Technology is ${s.tech}, nature is ${s.nature}/100, debt is ${s.debt}% of GDP and happiness is ${s.happiness}. How do you protect the valley?`,
      ru: s => `Ледниковое озеро над долиной вот-вот прорвётся, а ниже стоят тысячи домов. Технологии ${s.tech}, природа ${s.nature}/100, долг ${s.debt}% ВВП, счастье ${s.happiness}. Как защитить долину?`,
    },
    choices: [
      { arch: 'nature', fx: { nature: 11, happiness: -5, economy: -5, tech: -4, culture: -3, energy: -4 },
        title: { en: 'Move the villages uphill and give the floodplain back to the river', ru: 'Переселить сёла выше и вернуть пойму реке' },
        sub: { en: 'Safe homes at the cost of old streets and fields.', ru: 'Безопасные дома ценой старых улиц и полей.' },
        echo: { en: 'The villages are moved and the river reclaims its floodplain. People grieve for their old streets but sleep safely.', ru: 'Сёла переселены, река возвращает себе пойму. Люди скучают по старым улицам, но спят спокойно.' } },
      { arch: 'tech', fx: { economy: 6, tech: 4, energy: 5, nature: -8, debt: 22, culture: -3, literacy: -5 },
        title: { en: 'Pour a concrete dam and steel spillway under the lake', ru: 'Залить бетонную плотину и стальной водосброс под озером' },
        sub: { en: 'Hard engineering that works, at a heavy cost to the river.', ru: 'Жёсткая инженерия, которая работает, но тяжела для реки.' },
        echo: { en: 'The concrete holds the flood back. The valley survives, the river is cut in two and the bill is large.', ru: 'Бетон держит паводок. Долина жива, река разрезана надвое, а счёт велик.' } },
      { arch: 'sync', fx: { tech: 7, nature: 6, energy: 2, economy: -6, debt: 21, happiness: -1 },
        title: { en: 'Early-warning sensors, phone alerts and restored floodplain wetlands', ru: 'Датчики раннего оповещения, сигналы на телефоны и восстановленные поймы' },
        sub: { en: 'Sensors watch the lake, wetlands soak up the water and sirens give people time.', ru: 'Датчики следят за озером, болота впитывают воду, а сирены дают людям время.' },
        echo: { en: 'Sensors catch the surge and the wetlands soak it up, with time to spare. The valley is safe and the lesson is clear.', ru: 'Датчики ловят волну, болота впитывают воду, времени хватает. Долина цела, урок очевиден.' } },
    ],
  },
];
