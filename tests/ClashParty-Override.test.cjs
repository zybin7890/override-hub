const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const file = process.argv[2] || path.join(__dirname, '../javascript/ClashParty-Override.js');
const context = vm.createContext({console});
vm.runInContext(fs.readFileSync(file,'utf8'),context);
const run = (c,mode) => JSON.parse(JSON.stringify(context.main(c,mode)));
const proxy = (name,server='example.org') => ({name,server,type:'ss',port:443,cipher:'aes-128-gcm',password:'test-only'});
const base = () => ({proxies:[proxy('JP test'),proxy('KR original','kr.zybin.live')],rules:[]});
const checks = [
    ['JP 仅迁移 HY2/VLESS 并同步国旗引用',()=>{
        const c=base();c.proxies.push(
            {...proxy('jp'),type:'vless',server:'43.165.133.201'},
            {...proxy('jp hy2'),type:'hysteria2',server:'43.165.133.201',ports:'443,41000-41020','hop-interval':15,'dialer-proxy':'jp'},
            {...proxy('jp 低延'),type:'anytls',server:'43.165.133.201'}
        );c.rules=['DOMAIN,fixture.example,jp hy2'];
        const o=run(c);
        assert.equal(o.proxies.find(p=>p.name==='🇯🇵 JP').server,'43.165.175.13');
        assert.equal(o.proxies.find(p=>p.name==='🇯🇵 JP hy2').server,'43.165.175.13');
        assert.equal(o.proxies.find(p=>p.name==='🇯🇵 JP hy2')['dialer-proxy'],undefined);
        assert.equal(o.proxies.find(p=>p.name==='🇯🇵 JP hy2').ports,undefined);
        assert.deepEqual(o['proxy-groups'].find(g=>g.name==='JP出口').proxies,['🇯🇵 JP','🇯🇵 JP hy2']);
        assert(o.proxies.filter(p=>p.server==='43.165.175.13').every(p=>!p['dialer-proxy']));
        assert.equal(o.proxies.find(p=>p.name==='🇯🇵 JP 低延').server,'43.165.133.201');
        assert(o.rules.includes('DOMAIN,fixture.example,🇯🇵 JP hy2'));
        assert.deepEqual(run(o).proxies,o.proxies);
    }],
    ['SG 三协议固定 IPv4 且不影响其他地区',()=>{
        const cases=[
            {name:'SG stable',type:'vless',server:'104.234.177.140',port:443,uuid:'fixture-only'},
            {name:'SG fast',type:'hysteria2',server:'proxy.zybin.live',port:443,password:'fixture-only','ip-version':'ipv4'},
            {name:'SG low',type:'anytls',server:'2001:df4:c140:1f::525',port:10443,password:'fixture-only','ip-version':'dual'},
            proxy('SG commercial','other.example.org'),
            proxy('KR original','kr.zybin.live')
        ];
        const input={proxies:cases,rules:[]};
        for(const mode of [undefined,'__SERVER_GLOBAL__']){
            const output=run(input,mode);
            assert.equal(output.proxies.filter(p=>p.server==='104.234.177.140').length,3);
            for(const original of cases.slice(0,3)){
                const node=output.proxies.find(p=>p.name===original.name.replace(/^SG\s*/, '🇸🇬 SG '));
                assert.equal(node.server,'104.234.177.140');
                assert.equal(node['ip-version'],'ipv4');
                assert.equal(node.port,original.type==='anytls'?443:original.port);
                if(original.type==='anytls')assert.deepEqual(node.alpn,['anytls']);
                assert.equal(node.uuid||node.password,original.uuid||original.password);
                assert.equal(node['dialer-proxy'],undefined);
            }
            assert.equal(output.proxies.find(p=>p.name==='SG commercial').server,'other.example.org');
            assert.equal(output.proxies.find(p=>p.name==='🇰🇷 KR')['ip-version'],'ipv4');
            const repeated=run(output,mode);
            assert.deepEqual(repeated.proxies,output.proxies);
        }
        assert.equal(input.proxies[0].server,'104.234.177.140');
    }],
    ['DNS代理独立生成且国内解析直连',()=>{
        const o=run(base());
        assert(o['proxy-groups'].some(g=>g.name==='DNS代理'));
        assert(o.dns.nameserver.every(s=>s.endsWith('#DNS代理')));
        assert(o.dns['direct-nameserver'].every(s=>s.endsWith('#DIRECT')));
        assert.equal(o.dns['direct-nameserver-follow-policy'],false);
    }],
    ['不重新固定网卡或强制打开TUN',()=>{
        const o=run(base());assert(!o.proxies.some(p=>p['interface-name']));
        assert(!o.tun?.enable);assert(!run(base(),'__SERVER_GLOBAL__').tun?.enable);
    }],
    ['服务组可选择全部具体节点',()=>{
        const o=run(base());for(const n of ['GPT','Gemini','Grok','Claude','muse','Spotify','微软服务','苹果服务','游戏平台']){
            const g=o['proxy-groups'].find(g=>g.name===n);assert(g['include-all'] || o.proxies.every(p=>g.proxies.includes(p.name)));
        }
    }],
    ['节点更名同步改写规则目标',()=>{
        const c=base();c.rules=['DOMAIN,example.net,KR original'];const o=run(c);
        assert(o.rules.includes('DOMAIN,example.net,🇰🇷 KR'));
    }],
    ['不复活已修复的FluxDown强制直连',()=>{
        const c=base();c.rules=['PROCESS-NAME,fluxdownd.exe,DIRECT'];
        assert(!run(c).rules.includes('PROCESS-NAME,fluxdownd.exe,DIRECT'));
    }],
    ['空地区组不隐式直连',()=>{
        const c=base();c['proxy-providers']={remote:{type:'http',url:'https://example.org/test-only',path:'./test-only.yaml',interval:86400}};
        const o=run(c);for(const g of o['proxy-groups'].filter(g=>g.type==='url-test'||g.type==='fallback')) assert.equal(g['empty-fallback'],'REJECT');
    }],
    ['fake-IP rule模式不混入域名通配项',()=>{
        const c=base();c.dns={'fake-ip-filter-mode':'rule','fake-ip-filter':['DOMAIN,example.net,real-ip','MATCH,fake-ip']};
        const o=run(c);assert.equal(o.dns['fake-ip-filter-mode'],'rule');
        assert(o.dns['fake-ip-filter'].every(s=>s.includes(',')));
    }],
    ['传输链断裂显式报错而非删除节点',()=>{
        const c=base();c.proxies.push(proxy('HK excluded'));c.proxies[0]['dialer-proxy']='HK excluded';
        assert.throws(()=>run(c),/依赖|引用|dialer|节点/);
    }],
    ['真实机场常见emoji策略名规范化',()=>{
        const c=base();c['proxy-groups']=[{name:'🎯 全球直连',type:'select',proxies:['DIRECT']}];c.rules=['DOMAIN,example.net,🎯 全球直连'];
        const o=run(c);assert(o.rules.includes('DOMAIN,example.net,DIRECT'));
    }],
    ['规则集合监听器及子规则同步重命名',()=>{
        const c=base();c['rule-providers']={test:{type:'inline',behavior:'domain',payload:['example.net'],proxy:'KR original'}};
        c.listeners=[{name:'test',type:'mixed',port:0,proxy:'KR original'}];
        c['sub-rules']={child:['MATCH,KR original']};c.rules=['SUB-RULE,(DOMAIN,example.net),child'];
        const o=run(c);assert.equal(o['rule-providers'].test.proxy,'🇰🇷 KR');
        assert.equal(o.listeners[0].proxy,'🇰🇷 KR');assert.deepEqual(o['sub-rules'].child,['MATCH,🇰🇷 KR']);
    }],
    ['传输依赖组保留且不关闭证书验证',()=>{
        const c=base();c['proxy-groups']=[{name:'Transport',type:'select',proxies:['KR original']}];
        c.proxies[0]['dialer-proxy']='Transport';
        const o=run(c);assert.deepEqual(o['proxy-groups'].find(g=>g.name==='Transport').proxies,['🇰🇷 KR']);
        assert(!o.proxies.some(p=>p['skip-cert-verify']));
    }],
    ['Google和成人内容固定SG并优先于订阅例外',()=>{
        const c=base();c.rules=['DOMAIN,custom.google.com,DIRECT'];const o=run(c);
        assert(o.rules.indexOf('GEOSITE,google,SG出口')<o.rules.indexOf('DOMAIN,custom.google.com,DIRECT'));
        assert(o.rules.indexOf('GEOSITE,category-porn,SG出口')<o.rules.indexOf('GEOSITE,category-ai-!cn,节点选择'));
        assert(o.rules.indexOf('GEOSITE,youtube,JP出口')<o.rules.indexOf('GEOSITE,google,SG出口'));
        assert(!o.rules.includes('GEOSITE,youtube,SG出口'));
        assert.deepEqual(o['proxy-groups'].find(g=>g.name==='SG出口').proxies,['REJECT']);
        assert.deepEqual(o['proxy-groups'].find(g=>g.name==='谷歌服务').proxies,['SG出口']);
    }],
    ['五个 AI 策略组独立分流，Gemini 优先于 Google 泛规则',()=>{
        const c=base();c.rules=['DOMAIN,perplexity.example,AI','DOMAIN,av.example,av'];
        c['proxy-groups']=[{name:'av',type:'select',proxies:['DIRECT']}];
        const o=run(c);
        const sites={GPT:'chatgpt.com',Gemini:'gemini.google.com',Grok:'grok.com',Claude:'claude.ai',muse:'muse.ai'};
        const icons={GPT:'ChatGPT',Gemini:'Gemini',Claude:'Claude',muse:'Meta'};
        const grokIcon='https://raw.githubusercontent.com/zybin7890/override-hub/main/icons/Grok-Light.svg';
        const google=o.rules.indexOf('GEOSITE,google,SG出口');
        for(const [group,domain] of Object.entries(sites)){
            const selector=o['proxy-groups'].find(g=>g.name===group);
            assert.equal(selector.type,'select');
            if(group==='Grok') assert.equal(selector.icon,grokIcon);
            else assert(selector.icon.endsWith(`/icon/svg/common/${icons[group]}.svg`));
            const index=o.rules.indexOf(`DOMAIN-SUFFIX,${domain},${group}`);
            assert(index>=0 && index<google);
        }
        assert(!o['proxy-groups'].some(g=>g.name==='AI'));
        assert(o.rules.includes('DOMAIN,perplexity.example,节点选择'));
        assert(o.proxies.find(p=>p.name.includes('JP')).icon.endsWith('/icon/svg/flag/Japan.svg'));
        assert.equal(o['proxy-groups'].find(g=>g.name==='av').icon,'https://fastly.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f51e.svg');
        assert([...o.proxies,...o['proxy-groups']].filter(item=>!['Grok','av'].includes(item.name)).every(item=>
            item.icon.startsWith('https://raw.githubusercontent.com/aaANDkk/Qure_Style_SVG/') && item.icon.endsWith('.svg')));
    }],
    ['端口与已有TUN设置保留',()=>{
        const c=base();c['mixed-port']=47893;c.tun={enable:false,device:'Custom',mtu:1400,'strict-route':true};
        const o=run(c);assert.equal(o['mixed-port'],47893);assert.equal(o.tun.enable,false);
        assert.equal(o.tun.device,'Custom');assert.equal(o.tun.mtu,1400);assert.equal(o.tun['strict-route'],true);
    }]
];
let failures=0;
for(const [name,test] of checks){try{test();console.log('PASS',name)}catch(e){failures++;console.log('FAIL',name,e.message.split('\n')[0]);}}
console.log(JSON.stringify({total:checks.length,passed:checks.length-failures,failed:failures}));
process.exitCode=failures?1:0;
