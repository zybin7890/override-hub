/**
 * Clash Party / Clash Verge Rev · Mihomo 覆写 v3.3.0 · 2026-11-07
 * 格式：4 空格缩进、Allman 大括号、120 列限制、数组垂直展开
 * 依据本机两份真实订阅及 Mihomo v1.19.32 验证；脚本不包含订阅凭据。
 * 国内解析直连、海外解析经 DNS代理；保留订阅自定义规则及传输依赖。
 * 不强制开启 TUN、不固定物理网卡；客户端最终合并的 DNS/TUN 设置仍优先。
 * 入口：main( config, runtimeMode )；runtimeMode 可选。
 */

const HEALTH_URL = "https://cp.cloudflare.com/generate_204";
const DNS_BOOTSTRAP = [
    "223.5.5.5",
    "223.6.6.6"
];
const DNS_DOMESTIC = [
    "https://223.5.5.5/dns-query#DIRECT",
    "https://223.6.6.6/dns-query#DIRECT"
];
const DNS_FOREIGN = [
    "https://1.1.1.1/dns-query#DNS代理",
    "https://8.8.8.8/dns-query#DNS代理"
];
const ICON_BASE = "https://raw.githubusercontent.com/aaANDkk/Qure_Style_SVG/449f2449d312c4e06a655aca59bcd7cd766678bc/icon/svg/";

const NODE_EXCLUDE = "(?i)(香港|港|Hong[ _-]*Kong|(?:^|[^A-Za-z])HK\\d*(?:[^A-Za-z]|$)|" +
                     "官网|到期|^剩余|流量|套餐|重置|过期|失效|维护|订阅|倍率|" +
                     "Traffic|Expire|Slow|低速|慢速|测试|通知|距离下次|30675|xn--|^CF[｜|])";

const NODE_EXCLUDE_JS = new RegExp ( NODE_EXCLUDE.replace( /^\(\?i\)/, "" ), "i" );

const REGIONS = [
    {
        code : "SG",
        filter : "(?i)(新加坡|狮城|Singapore|Lion[ _-]*City|🇸🇬|(?:^|[^A-Za-z])SG\\d*(?:[^A-Za-z]|$))",
        icon : "flag/Singapore.svg"
    },
    {
        code : "US",
        filter : "(?i)(美国|美國|United[ _-]*States|America|Los[ _-]*Angeles|San[ _-]*Jose|" +
                     "Seattle|Chicago|New[ _-]*York|Dallas|Ashburn|🇺🇸|(?:^|[^A-Za-z])(?:US|USA)\\d*(?:[^A-Za-z]|$))",
        icon : "flag/United_States.svg"
    },
    {
        code : "JP",
        filter : "(?i)(日本|Japan|Tokyo|Osaka|Nagoya|Sakura|🇯🇵|(?:^|[^A-Za-z])JP\\d*(?:[^A-Za-z]|$))",
        icon : "flag/Japan.svg"
    },
    {
        code : "TW",
        filter : "(?i)(台湾|台灣|Taiwan|Taipei|🇹🇼|(?:^|[^A-Za-z])TW\\d*(?:[^A-Za-z]|$))",
        icon : "flag/China_Taiwan.svg"
    },
    {
        code : "KR",
        filter : "(?i)(韩国|韓國|Korea|Seoul|🇰🇷|(?:^|[^A-Za-z])KR\\d*(?:[^A-Za-z]|$))",
        icon : "flag/South_Korea.svg"
    },
    {
        code : "PH",
        filter : "(?i)(菲律宾|菲律賓|Philippines|Manila|🇵🇭|(?:^|[^A-Za-z])PH\\d*(?:[^A-Za-z]|$))",
        icon : "flag/Philippines.svg"
    }
];

// 正则只编译一次；Mihomo 输出保留 RE2 的 (?i) 写法。
const REGION_MATCHERS = REGIONS.map( function ( region )
{
    return new RegExp ( region.filter.replace( /^\(\?i\)/, "" ), "i" );
} );

const SERVICES = [
    [
        "谷歌服务",
        "common/Google.svg"
    ],
    [
        "微软服务",
        "common/Microsoft.svg"
    ],
    [
        "苹果服务",
        "common/Apple.svg"
    ],
    [
        "Spotify",
        "common/Spotify.svg"
    ],
    [
        "游戏平台",
        "common/Game.svg"
    ]
];

const FAKE_IP_FILTER = [
    "geosite:category-games",
    "+.lan",
    "+.local",
    "+.localhost",
    "time.*.com",
    "ntp.*.com",
    "+.steamcontent.com",
    "+.steampowered.com",
    "+.steamstatic.com",
    "+.steamserver.net",
    "+.steamchina.com",
    "+.steamcommunity.com",
    "+.steam-chat.com",
    "+.valvesoftware.com",
    "+.steam.clngaa.com",
    "+.dl.steam.ksyna.com",
    "+.st.dl.eccdnx.com",
    "+.st.dl.pinyuncloud.com",
    "+.pphimalayanrt.com",
    "+.epicgamescdn.com",
    "+.epicgames.com",
    "steampipe.akamaized.net",
    "steampipe-kr.akamaized.net",
    "steampipe-partner.akamaized.net",
    "kr.zybin.live"
];

const AI_SERVICES = {
    GPT : {
        icon : "common/ChatGPT.svg",
        geosite : "openai",
        domains : [
            "chatgpt.com",
            "chat.com",
            "openai.com",
            "oaistatic.com",
            "oaiusercontent.com",
            "sora.com",
            "chatgpt.livekit.cloud",
            "turn.livekit.cloud",
            "host.livekit.cloud"
        ]
    },
    Gemini : {
        icon : "common/Gemini.svg",
        geosite : "google-gemini",
        domains : [
            "gemini.google.com",
            "gemini.googleusercontent.com",
            "aistudio.google.com",
            "ai.google.dev",
            "generativeai.google",
            "generativelanguage.googleapis.com",
            "makersuite.google.com",
            "notebooklm.google.com",
            "notebooklm.google",
            "jules.google.com",
            "jules.google",
            "labs.google",
            "deepmind.google",
            "deepmind.com",
            "proactivebackend-pa.googleapis.com",
            "aisandbox-pa.googleapis.com",
            "geller-pa.googleapis.com",
            "robinfrontend-pa.googleapis.com",
            "alkalimakersuite-pa.clients6.google.com",
            "cloudcode-pa.googleapis.com",
            "daily-cloudcode-pa.googleapis.com",
            "jetski-webchannel.googleapis.com",
            "antigravity.google",
            "antigravity.google.com",
            "antigravity-unleash.goog"
        ]
    },
    Grok : {
        icon : "common/Grok.svg",
        geosite : "xai",
        domains : [
            "grok.com",
            "x.ai"
        ]
    },
    Claude : {
        icon : "common/Claude.svg",
        geosite : "anthropic",
        domains : [
            "anthropic.com",
            "claude.ai",
            "claude.com",
            "claudeusercontent.com",
            "claudemcpclient.com"
        ]
    },
    muse : {
        icon : "common/Meta.svg",
        domains : [
            "muse.ai"
        ]
    }
};

const OTHER_AI_DOMAINS = [
    "copilot.microsoft.com",
    "copilot.cloud.microsoft",
    "githubcopilot.com",
    "perplexity.ai",
    "perplexity.com",
    "pplx.ai",
    "poe.com",
    "poecdn.net",
    "cursor.com",
    "cursor.sh",
    "cursorapi.com",
    "cursor-cdn.com",
    "windsurf.com",
    "windsurf.ai",
    "codeium.com",
    "devin.ai",
    "coderabbit.ai",
    "v0.dev",
    "lovable.dev",
    "huggingface.co",
    "huggingfaceusercontent.com",
    "hf.co",
    "openrouter.ai",
    "mistral.ai",
    "groq.com",
    "cerebras.ai",
    "cohere.com",
    "together.ai",
    "fireworks.ai",
    "replicate.com",
    "replicate.delivery",
    "runpod.io",
    "fal.ai",
    "chutes.ai",
    "meta.ai",
    "dify.ai",
    "jasper.ai",
    "openart.ai",
    "clipdrop.co"
];

const STEAM_DOWNLOAD = [
    "steamcontent.com",
    "steampipe.akamaized.net",
    "steam.clngaa.com",
    "dl.steam.ksyna.com",
    "st.dl.eccdnx.com",
    "st.dl.pinyuncloud.com",
    "st.dl.bscstorage.net",
    "steamcontent.tnkjmec.com",
    "pphimalayanrt.com",
    "cyngaa.com",
    "manlaxy.com"
];

const GAME_DOWNLOAD = [
    "download.epicgames.com",
    "download2.epicgames.com",
    "download3.epicgames.com",
    "download4.epicgames.com",
    "fastly-download.epicgames.com",
    "epicgames-download1.akamaized.net",
    "epicgamescdn.com",
    "dyn.riotcdn.net",
    "cdn.ubi.com",
    "packagespc.xboxlive.com",
    "xvcf1.xboxlive.com",
    "xvcf2.xboxlive.com"
];

function clone ( value )
{
    return JSON.parse( JSON.stringify( value ) );
}

function unique ( values )
{
    return Array.from( new Set ( values.filter( Boolean ) ) );
}

function mergeObject ( oldValue, extra )
{
    return Object.assign( {}, oldValue || {}, extra );
}

function renameGroup ( name )
{
    const cleaned = String ( name || "" ).replace( /^[^\p{L}\p{N}_]+/u, "" ).trim();

    const aliases = {
        "Google" : "谷歌服务",
        "人工智能" : "节点选择",
        "AI" : "节点选择",
        "GitHub" : "节点选择",
        "Telegram" : "节点选择",
        "YouTube" : "谷歌服务",
        "谷歌 FCM" : "谷歌服务",
        "云端储存" : "节点选择",
        "游戏平台" : "游戏平台",
        "国内媒体" : "DIRECT",
        "漏网之鱼" : "漏网之鱼",
        "全球直连" : "DIRECT",
        "游戏下载" : "DIRECT",
        "哔哩哔哩" : "DIRECT",
        "Bilibili" : "DIRECT",
        "BiliBili" : "DIRECT",
        "国外媒体" : "节点选择",
        "Netflix" : "节点选择",
        "Disney+" : "节点选择",
        "TikTok" : "节点选择",
        "EMBY" : "节点选择",
        "负载均衡" : "自动选择",
        "智能均衡" : "自动选择",
        "智能平衡" : "自动选择",
        "智能测速" : "自动选择",
        "自动" : "自动选择"
    };

    const managed = [
        "节点选择",
        "自动选择",
        "故障转移",
        ...Object.keys( AI_SERVICES ),
        "Spotify",
        "谷歌服务",
        "微软服务",
        "苹果服务",
        "游戏平台",
        "漏网之鱼",
        "DNS代理"
    ];
    return aliases[ cleaned ] || ( managed.includes( cleaned ) ? cleaned : name );
}

function targetOfRule ( rule )
{
    // 只解析末尾字段，避免 AND/OR 的内部逗号干扰策略名。
    const fields = String ( rule ).split( "," );
    if ( fields[ fields.length - 1 ] === "no-resolve" )
    {
        fields.pop();
    }

    return fields.length >= 2 ? fields[ fields.length - 1 ] : null;
}

function rewriteRule ( rule, renamed, keepMatch )
{
    if ( typeof rule !== "string" || ( !keepMatch && /^MATCH,/.test( rule ) ) )
    {
        return null;
    }

    const fields = rule.split( "," );
    const noResolve = fields[ fields.length - 1 ] === "no-resolve";
    if ( noResolve )
    {
        fields.pop();
    }

    if ( fields.length < 2 || fields[ 0 ] === "SUB-RULE" )
    {
        return rule;
    }

    const target = fields.pop();
    fields.push( ( renamed && renamed.get( target ) ) || renameGroup ( target ) );
    if ( noResolve )
    {
        fields.push( "no-resolve" );
    }

    return fields.join( "," );
}

function ruleKey ( rule )
{
    const match = String ( rule ).match(
        /^(DOMAIN(?:-SUFFIX|-KEYWORD)?|GEOSITE|GEOIP|IP-CIDR6?|PROCESS-(?:NAME|PATH)|RULE-SET),([^,]+)/ );
    if ( !match )
        return rule;
    // no-resolve 会影响是否触发 DNS，不能与未带此标记的 IP 规则混为一条。
    const key = match[ 1 ] + "," + ( match[ 1 ].startsWith( "DOMAIN" ) ? match[ 2 ].toLowerCase() : match[ 2 ] );
    return key + ( /,no-resolve$/.test( rule ) ? ",no-resolve" : "" );
}

function setNodeIcon ( proxy )
{
    const subject = String ( proxy.name || "" ) + " " + String ( proxy.server || "" );

    for ( let index = 0; index < REGIONS.length; ++index )
    {
        const region = REGIONS[ index ];
        if ( REGION_MATCHERS[ index ].test( subject ) )
        {
            proxy.icon = ICON_BASE + region.icon;
            return;
        }
    }

    proxy.icon = ICON_BASE + "common/Proxy.svg";
}

function configureNodes ( config )
{
    const renamed = new Map ();
    const existing = new Set ();
    let koreanCount = 0;
    const proxies = [];

    for ( const proxy of config.proxies || [] )
    {
        if ( !proxy || typeof proxy.name !== "string" )
        {
            continue;
        }

        const node = clone ( proxy );
        if ( node.server === "104.234.177.140" || node.server === "proxy.zybin.live" ||
             node.server === "2001:df4:c140:1f::525" || node.server === "mail.zybin.live" )
        {
            node.server = "104.234.177.140";
            node[ "ip-version" ] = "ipv4";
            if ( node.type === "anytls" )
            {
                node.port = 443;
                node.alpn = [ "anytls" ];
            }
        }

        if ( ( node.server === "43.165.133.201" || node.server === "43.165.175.13" ) &&
             [ "vless", "hysteria2" ].includes( node.type ) )
        {
            node.server = "43.165.175.13";
            node[ "ip-version" ] = "ipv4";
            if ( node.type === "vless" )
                node[ "reality-opts" ] = Object.assign( {}, node[ "reality-opts" ], {
                    "public-key" : "_dYb4j6fgat3e-NNkTiWqs4xkcCxkZlZUwyzEW1_DkA"
                } );
            if ( node.type === "hysteria2" )
            {
                node.sni = "43.165.175.13";
                delete node.ports;
                delete node[ "hop-interval" ];
                delete node[ "dialer-proxy" ];
                node.fingerprint = "b9f1051a21ba547ab59bb1da311cbf9705075b2517d30784c7d223c59f67752f";
            }
        }

        if ( node.server === "101.33.66.221" )
        {
            node.server = "kr.zybin.live";
        }

        const isKr = node.server === "kr.zybin.live";
        const subject = node.name + " " + String ( node.server || "" );
        if ( ( !isKr && NODE_EXCLUDE_JS.test( subject ) ) || node.server === "45.127.34.59" ||
             ( node.server === "kkvlvvq-a.catcat321.com" && Number ( node.port ) === 20039 ) )
        {
            continue;
        }

        const originalName = node.name;
        if ( node.server === "104.234.177.140" )
            node.name = node.name.replace( /^SG\s*(?:🇸🇬\s*)?/i, "🇸🇬 SG " ).trim();
        if ( node.server === "43.165.133.201" || node.server === "43.165.175.13" )
            node.name = node.name.replace( /^JP\s*(?:🇯🇵\s*)?/i, "🇯🇵 JP " ).trim();
        if ( isKr )
        {
            koreanCount++;
            node.name = koreanCount === 1 ? "🇰🇷 KR" : "🇰🇷 KR " + koreanCount;
            node[ "ip-version" ] = "ipv4";
            // UDP 能力、网卡绑定和证书验证沿用订阅，不猜测协议能力。
        }

        if ( existing.has( node.name ) )
        {
            throw new Error ( "订阅节点重名：" + node.name );
        }

        existing.add( node.name );
        renamed.set( originalName, node.name );
        setNodeIcon ( node );
        proxies.push( node );
    }

    // 订阅中的 dialer-proxy 可引用其他节点，必须同步更新被重命名的节点名称。
    for ( const node of proxies )
    {
        if ( node[ "dialer-proxy" ] )
        {
            node[ "dialer-proxy" ] = renamed.get( node[ "dialer-proxy" ] ) || renameGroup ( node[ "dialer-proxy" ] );
        }
    }

    renamed.removed = new Set ( ( config.proxies || [] )
                                    .map( function ( node )
                                    {
                                        return node.name;
                                    } )
                                    .filter( function ( name )
                                    {
                                        return !renamed.has( name );
                                    } ) );
    config.proxies = proxies;
    return renamed;
}

function configureProviders ( config, renamed )
{
    for ( const provider of Object.values( config[ "proxy-providers" ] || {} ) )
    {
        if ( !provider || typeof provider !== "object" )
        {
            continue;
        }

        if ( provider.proxy )
        {
            provider.proxy = renamed.get( provider.proxy ) || renameGroup ( provider.proxy );
        }

        if ( provider[ "dialer-proxy" ] )
        {
            provider[ "dialer-proxy" ] =
                renamed.get( provider[ "dialer-proxy" ] ) || renameGroup ( provider[ "dialer-proxy" ] );
        }
        if ( provider.override && provider.override[ "dialer-proxy" ] )
        {
            provider.override[ "dialer-proxy" ] = renamed.get( provider.override[ "dialer-proxy" ] ) ||
                                                  renameGroup ( provider.override[ "dialer-proxy" ] );
        }

        if ( Array.isArray( provider.payload ) )
        {
            for ( const node of provider.payload )
            {
                if ( node && node[ "dialer-proxy" ] )
                {
                    node[ "dialer-proxy" ] =
                        renamed.get( node[ "dialer-proxy" ] ) || renameGroup ( node[ "dialer-proxy" ] );
                }
            }
        }

        if ( !String ( provider[ "exclude-filter" ] || "" ).includes( NODE_EXCLUDE ) )
        {
            provider[ "exclude-filter" ] = provider[ "exclude-filter" ]
                                               ? "(?:" + provider[ "exclude-filter" ] + ")|(?:" + NODE_EXCLUDE + ")"
                                               : NODE_EXCLUDE;
        }

        if ( !provider[ "health-check" ] || provider[ "health-check" ].enable !== false )
        {
            provider[ "health-check" ] = mergeObject ( provider[ "health-check" ], {
                enable : true,
                url : HEALTH_URL,
                interval : 300,
                timeout : 3000,
                lazy : true,
                "expected-status" : "204"
            } );
        }
    }
}

function getActiveRegions ( config )
{
    const hasProvider = Object.keys( config[ "proxy-providers" ] || {} ).length > 0;
    if ( hasProvider )
    {
        return REGIONS;
    }

    return REGIONS.filter( function ( region, index )
    {
        return ( config.proxies || [] ).some( function ( node )
        {
            return REGION_MATCHERS[ index ].test( node.name + " " + String ( node.server || "" ) );
        } );
    } );
}

function selectGroup ( name, proxies, icon, includeAll )
{
    const group = {
        name : name,
        type : "select",
        proxies : unique ( proxies ),
        "store-selected" : true,
        icon : ICON_BASE + icon
    };

    if ( includeAll )
    {
        group[ "include-all" ] = true;
        group[ "exclude-filter" ] = NODE_EXCLUDE;
    }

    return group;
}

function healthGroup ( name, type, icon, filter, lazy, excludeKr )
{
    const group = {
        name : name,
        type : type,
        proxies : [],
        "include-all" : true,
        "exclude-filter" : NODE_EXCLUDE + ( excludeKr && name !== "KR自动选择" ? "|^🇰🇷 KR(?: \\d+)?$" : "" ),
        url : HEALTH_URL,
        interval : lazy ? 300 : 60,
        timeout : 3000,
        lazy : lazy,
        "max-failed-times" : 3,
        "empty-fallback" : "REJECT",
        "expected-status" : "204",
        icon : ICON_BASE + icon
    };

    if ( type === "url-test" )
    {
        group.tolerance = 100;
    }

    if ( filter )
    {
        group.filter = filter;
    }

    return group;
}

function configureGroups ( config, sourceGroups, renamed )
{
    const regions = getActiveRegions ( config );
    const regionNames = regions.map( function ( region )
    {
        return region.code + "自动选择";
    } );

    const hasOtherNodes = config.proxies.some( function ( node )
    {
        return node.server !== "kr.zybin.live";
    } ) || Object.keys( config[ "proxy-providers" ] || {} ).length > 0;

    const groups = [
        selectGroup ( "节点选择", [
            "自动选择",
            ...regionNames,
            "故障转移",
            "DIRECT"
        ], "common/Proxy.svg", true ),
        healthGroup ( "自动选择", "url-test", "common/Auto.svg", null, false, hasOtherNodes ),
        healthGroup ( "故障转移", "fallback", "common/LinkCube.svg", null, true, hasOtherNodes ),
        ...[
            ...Object.entries( AI_SERVICES ).map( ( [ name, service ] ) => [ name, service.icon ] ),
            ...SERVICES
        ].map( function ( service )
        {
            return selectGroup (
                service[ 0 ], [
                    "节点选择",
                    ...regionNames,
                    "自动选择",
                    "故障转移",
                    "DIRECT"
                ], service[ 1 ], true );
        } ),
        selectGroup ( "漏网之鱼", [
            "节点选择",
            "自动选择",
            "故障转移",
            "DIRECT"
        ], "common/Final.svg", false ),
        selectGroup ( "DNS代理", [
            "自动选择"
        ], "common/Server.svg", false ),
        healthGroup ( "SG出口", "url-test", "flag/Singapore.svg", null, false, false ),
        healthGroup ( "JP出口", "url-test", "flag/Japan.svg", null, false, false ),
        ...regions.map( function ( region )
        {
            return healthGroup ( region.code + "自动选择", "url-test", region.icon, region.filter, false, false );
        } )
    ];

    // 静态节点按名称和服务器识别地区；提供者仅能按运行时节点名过滤。
    // 显式列出静态节点也让“只有国旗/服务器带地区”的节点不会落入空组。
    const providerNames = Object.keys( config[ "proxy-providers" ] || {} );
    for ( const group of groups )
    {
        if ( group.name === "SG出口" || group.name === "JP出口" )
        {
            group.proxies = config.proxies.filter( function ( node )
            {
                return node.server === ( group.name === "SG出口" ? "104.234.177.140" : "43.165.175.13" );
            } ).map( function ( node ) { return node.name; } );
            if ( !group.proxies.length )
                group.proxies = [ "REJECT" ];
            delete group[ "include-all" ];
            continue;
        }
        if ( group.type !== "url-test" && group.type !== "fallback" )
            continue;
        const regionIndex = REGIONS.findIndex( function ( region )
        {
            return group.name === region.code + "自动选择";
        } );
        group.proxies =
            config.proxies
                .filter( function ( node )
                {
                    return regionIndex >= 0
                               ? REGION_MATCHERS[ regionIndex ].test( node.name + " " + String ( node.server || "" ) )
                               : ( !hasOtherNodes || node.server !== "kr.zybin.live" );
                } )
                .map( function ( node )
                {
                    return node.name;
                } );
        delete group[ "include-all" ];
        if ( providerNames.length )
            group.use = providerNames.slice();
    }

    const names = new Set ( groups.map( function ( group )
    {
        return group.name;
    } ) );
    const sourceMap = new Map ( sourceGroups.filter( Boolean ).map( function ( group )
    {
        return [
            group.name,
            group
        ];
    } ) );
    const proxyNames = new Set ( config.proxies.map( function ( proxy )
    {
        return proxy.name;
    } ) );
    const retaining = new Set ();
    for ( const name of proxyNames )
    {
        if ( names.has( name ) ||
             [
                 "DIRECT",
                 "REJECT",
                 "REJECT-DROP",
                 "PASS",
                 "COMPATIBLE",
                 "GLOBAL"
             ].includes( name ) )
        {
            throw new Error ( "节点名与保留策略名冲突：" + name );
        }
    }

    function retain ( name )
    {
        name = renamed.get( name ) || renameGroup ( name );
        if ( !name || names.has( name ) || proxyNames.has( name ) ||
             [
                 "DIRECT",
                 "REJECT",
                 "REJECT-DROP",
                 "PASS",
                 "COMPATIBLE"
             ].includes( name ) )
        {
            return;
        }

        if ( retaining.has( name ) )
        {
            throw new Error ( "策略组循环依赖：" + name );
        }
        if ( !sourceMap.has( name ) )
        {
            return;
        }

        retaining.add( name );
        const group = clone ( sourceMap.get( name ) );
        const icons = {
            "av" : "common/Lock.svg",
            "JP出口" : "flag/Japan.svg",
            "SG出口" : "flag/Singapore.svg",
            "url-test" : "common/Auto.svg",
            "fallback" : "common/LinkCube.svg"
        };
        group.icon = ICON_BASE + ( icons[ name ] || icons[ group.type ] || "common/Proxy.svg" );
        group.proxies = unique ( ( group.proxies || [] ).map( function ( member )
        {
                            return renamed.get( member ) || renameGroup ( member );
                        } ) )
                            .filter( function ( member )
                            {
                                // 仅清理被节点过滤明确移除的成员；未知引用交给最终校验报错。
                                return !renamed.removed.has( member );
                            } );
        group.proxies.forEach( retain );
        if ( group[ "dialer-proxy" ] )
        {
            group[ "dialer-proxy" ] = renamed.get( group[ "dialer-proxy" ] ) || renameGroup ( group[ "dialer-proxy" ] );
            retain ( group[ "dialer-proxy" ] );
        }

        if ( group[ "include-all" ] || group[ "include-all-proxies" ] || group[ "include-all-providers" ] )
        {
            group[ "exclude-filter" ] = group[ "exclude-filter" ]
                                            ? "(?:" + group[ "exclude-filter" ] + ")|(?:" + NODE_EXCLUDE + ")"
                                            : NODE_EXCLUDE;
        }

        groups.push( group );
        names.add( group.name );
        retaining.delete( name );
    }

    // 仅保留正在被节点传输链、提供者或者订阅原规则引用的旧策略组。
    for ( const proxy of config.proxies )
    {
        retain ( proxy[ "dialer-proxy" ] );
    }

    for ( const provider of Object.values( config[ "proxy-providers" ] || {} ) )
    {
        if ( provider )
        {
            retain ( provider.proxy );
            retain ( provider[ "dialer-proxy" ] );
            retain ( provider.override && provider.override[ "dialer-proxy" ] );
            for ( const node of provider.payload || [] )
                retain ( node[ "dialer-proxy" ] );
        }
    }

    for ( const rule of config.rules || [] )
    {
        retain ( targetOfRule ( rule ) );
    }

    rewriteAuxiliaryReferences ( config, renamed, retain );

    config[ "proxy-groups" ] = groups;
}

function configureDns ( config )
{
    const dns = config.dns || {};
    const oldFilters = Array.isArray( dns[ "fake-ip-filter" ] ) ? dns[ "fake-ip-filter" ] : [];
    const oldPolicy = dns[ "nameserver-policy" ] || {};
    const filterMode = dns[ "fake-ip-filter-mode" ] || "blacklist";
    let filters;
    if ( filterMode === "rule" )
    {
        const additions = FAKE_IP_FILTER.map( function ( item )
        {
            if ( item.startsWith( "geosite:" ) )
                return "GEOSITE," + item.slice( 8 ) + ",real-ip";
            if ( item.startsWith( "+." ) )
                return "DOMAIN-SUFFIX," + item.slice( 2 ) + ",real-ip";
            return "DOMAIN-WILDCARD," + item + ",real-ip";
        } );
        filters = unique ( [
            ...additions,
            ...oldFilters
        ] );
    }
    else if ( filterMode === "blacklist" || filterMode === "whitelist" )
    {
        // 白名单表示仅匹配项分配 fake-IP，不能把 real-IP 例外直接并入。
        filters = filterMode === "whitelist" ? oldFilters : unique ( [
            ...oldFilters.filter( function ( item )
            {
                return item !== "*";
            } ),
            ...FAKE_IP_FILTER
        ] );
    }
    else
    {
        throw new Error ( "未知 fake-ip-filter-mode：" + filterMode );
    }

    const domesticPolicy = {
        "geosite:cn,private,apple@cn,microsoft@cn,category-games@cn,steam@cn" : DNS_DOMESTIC.slice(),
        "geosite:geolocation-!cn" : DNS_FOREIGN.slice(),
        "+.cn" : DNS_DOMESTIC.slice(),
        "kr.zybin.live" : DNS_DOMESTIC.slice()
    };
    for ( const domain of STEAM_DOWNLOAD )
        domesticPolicy[ "+." + domain ] = DNS_DOMESTIC.slice();
    // 更新旧 policy 的已有值，避免不同 geosite 组合键重复加载同一集合。
    const policy = {};
    for ( const key of Object.keys( oldPolicy ) )
    {
        const domestic = /^geosite:/.test( key ) && key.slice( 8 ).split( "," ).every( function ( item )
        {
            return [
                "cn",
                "private",
                "apple@cn",
                "apple-cn",
                "microsoft@cn",
                "category-games@cn",
                "steam@cn"
            ]
                .includes( item );
        } );
        if ( !domestic )
            policy[ key ] = oldPolicy[ key ];
    }

    config.dns = mergeObject ( dns, {
        enable : true,
        ipv6 : false,
        "cache-algorithm" : "arc",
        "prefer-h3" : false,
        "enhanced-mode" : "fake-ip",
        "fake-ip-range" : "198.18.0.1/16",
        "fake-ip-filter-mode" : filterMode,
        "fake-ip-filter" : filters,
        "default-nameserver" : DNS_BOOTSTRAP.slice(),
        "nameserver" : DNS_FOREIGN.slice(),
        "proxy-server-nameserver" : DNS_DOMESTIC.slice(),
        "direct-nameserver" : DNS_DOMESTIC.slice(),
        "direct-nameserver-follow-policy" : false,
        "respect-rules" : true,
        "use-hosts" : true,
        "use-system-hosts" : true,
        fallback : [],
        "nameserver-policy" : mergeObject ( policy, domesticPolicy ),
        "proxy-server-nameserver-policy" :
            mergeObject ( dns[ "proxy-server-nameserver-policy" ], {
                "kr.zybin.live" : DNS_DOMESTIC.slice()
            } )
    } );

    // 未配置 fallback 时没有必要保留启用 fallback 的条件表。
    delete config.dns[ "fallback-filter" ];
}

function configureTun ( config )
{
    // TUN 开关、设备、路由和 MTU 由实际客户端/服务器决定。
    // 未提供 TUN 的订阅不主动接管整机流量。
    if ( !config.tun )
        return;
    const tun = config.tun || {};
    config.tun = mergeObject (
        tun, {
            "dns-hijack" : unique ( [
            ...( tun[ "dns-hijack" ] || [] ),
            "any:53",
            "tcp://any:53"
        ] )
        } );

    // Mihomo 官方 TUN 不支持 bypass-program：改用 PROCESS-NAME 规则直连。
    delete config.tun[ "bypass-program" ];
}

function configureSniffer ( config )
{
    config.sniffer = mergeObject ( config.sniffer, {
        enable : true,
        "parse-pure-ip" : true,
        "force-dns-mapping" : true,
        "override-destination" : true,
        sniff :
            {
                TLS : {
                ports : [
                443,
                8443
            ]
            },
                HTTP : {
                ports : [
                80,
                "8080-8888"
            ],
                "override-destination" : true
            }
            },
        "skip-domain" : unique ( [
            ...( ( config.sniffer || {} )[ "skip-domain" ] || [] ),
            "+.push.apple.com",
            "+.steamcontent.com",
            "+.steamserver.net",
            "+.steampowered.com"
        ] )
    } );
}

function buildRules ( config, serverMode, renamed )
{
    const rules = [];
    const seen = new Set ();
    const suffixes = new Map ();

    function add ( rule )
    {
        const key = ruleKey ( rule );
        const domain = /^(DOMAIN|DOMAIN-SUFFIX),([^,]+),([^,]+)$/.exec( rule );
        if ( domain )
        {
            const labels = domain[ 2 ].toLowerCase().split( "." );
            for ( let index = 0; index < labels.length; ++index )
            {
                if ( suffixes.get( labels.slice( index ).join( "." ) ) === domain[ 3 ] )
                    return;
            }
        }
        if ( !seen.has( key ) )
        {
            seen.add( key );
            rules.push( rule );
            if ( domain && domain[ 1 ] === "DOMAIN-SUFFIX" && domain[ 3 ] !== "PASS" )
            {
                suffixes.set( domain[ 2 ].toLowerCase(), domain[ 3 ] );
            }
        }
    }

    // 1. 本机、局域网和 DNS：任何应用均不得抢占本地地址。
    for ( const domain of [
        "localhost",
        "lan",
        "local",
        "internal",
        "home.arpa"
    ] )
    {
        add ( "DOMAIN-SUFFIX," + domain + ",DIRECT" );
    }

    for ( const cidr of [
        "0.0.0.0/8",
        "10.0.0.0/8",
        "100.64.0.0/10",
        "127.0.0.0/8",
        "169.254.0.0/16",
        "172.16.0.0/12",
        "192.168.0.0/16",
        "224.0.0.0/4"
    ] )
    {
        add ( "IP-CIDR," + cidr + ",DIRECT,no-resolve" );
    }

    for ( const cidr of [
        "::1/128",
        "fc00::/7",
        "fe80::/10"
    ] )
    {
        add ( "IP-CIDR6," + cidr + ",DIRECT,no-resolve" );
    }

    add ( "DOMAIN,detectportal.firefox.com,DIRECT" );
    add ( "DOMAIN,www.msftconnecttest.com,DIRECT" );
    add ( "DOMAIN,www.msftncsi.com,DIRECT" );
    add ( "DOMAIN-SUFFIX,doh.pub,DIRECT" );
    add ( "IP-CIDR,119.29.29.29/32,DIRECT,no-resolve" );
    add ( "IP-CIDR,223.5.5.5/32,DIRECT,no-resolve" );
    add ( "IP-CIDR,223.6.6.6/32,DIRECT,no-resolve" );
    add ( "DOMAIN,kr.zybin.live,DIRECT" );

    // 专用 AI 域名优先于 Google 泛规则。
    for ( const [ name, service ] of Object.entries( AI_SERVICES ) )
    {
        for ( const domain of service.domains )
            add ( "DOMAIN-SUFFIX," + domain + "," + name );
        if ( service.geosite )
            add ( "GEOSITE," + service.geosite + "," + name );
    }

    add ( "DOMAIN,alkalicore-pa.clients6.google.com,Gemini" );
    add ( "DOMAIN,webchannel-alkalimakersuite-pa.clients6.google.com,Gemini" );

    // 一般 Google 流量保留固定区域策略。
    add ( "GEOSITE,youtube,JP出口" );
    add ( "GEOSITE,google,SG出口" );
    add ( "GEOSITE,category-porn,SG出口" );

    // PikPak 保留此前明确要求；FluxDown BT 继续按目的地址分流。
    for ( const domain of [
        "mypikpak.com",
        "pikpak.io",
        "pikpak.me"
    ] )
    {
        add ( "DOMAIN-SUFFIX," + domain + ",节点选择" );
    }
    if ( !serverMode )
    {
        add ( "PROCESS-NAME,PikPak.exe,节点选择" );
        add ( "PROCESS-NAME,DownloadServer.exe,节点选择" );
    }

    // 2. Antigravity 进程：仅公共网络经 Gemini；其余程序的 Google 登录不受影响。
    if ( !serverMode )
    {
        const local = "OR,((DOMAIN,localhost),(DOMAIN-SUFFIX,lan),(DOMAIN-SUFFIX,local)," +
                      "(IP-CIDR,10.0.0.0/8,no-resolve),(IP-CIDR,127.0.0.0/8,no-resolve)," +
                      "(IP-CIDR,172.16.0.0/12,no-resolve),(IP-CIDR,192.168.0.0/16,no-resolve)," +
                      "(IP-CIDR6,::1/128,no-resolve),(IP-CIDR6,fc00::/7,no-resolve)," +
                      "(IP-CIDR6,fe80::/10,no-resolve))";

        add ( "AND,((PROCESS-NAME,Antigravity.exe),(NOT,((" + local + ")))),Gemini" );
        add ( "AND,((PROCESS-PATH-REGEX,(?i).*[/\\\\]antigravity[/\\\\]resources[/\\\\]bin[/\\\\]" +
              "language_server\\.exe$),(NOT,((" + local + ")))),Gemini" );
    }

    // 3. 游戏下载直连。只对内容域名生效，避免影响商店 / 社区。
    for ( const domain of STEAM_DOWNLOAD )
    {
        add ( "DOMAIN-SUFFIX," + domain + ",DIRECT" );
    }

    for ( const domain of GAME_DOWNLOAD )
    {
        add ( "DOMAIN-SUFFIX," + domain + ",DIRECT" );
    }

    for ( const domain of [
        "store.steampowered.com",
        "checkout.steampowered.com",
        "steamcommunity.com",
        "steamstatic.com",
        "steamusercontent.com",
        "steam-chat.com"
    ] )
    {
        add ( "DOMAIN-SUFFIX," + domain + ",游戏平台" );
    }

    if ( !serverMode )
    {
        for ( const process of [
            "steam.exe",
            "steamservice.exe",
            "steamerrorreporter64.exe",
            "qbittorrent.exe",
            "aria2c.exe",
            "BitComet.exe",
            "BitComet_x64.exe",
            "Thunder.exe",
            "baidunetdisk.exe"
        ] )
        {
            add ( "PROCESS-NAME," + process + ",DIRECT" );
        }

        // 对指定的 Google Drive 上传服务阻断 QUIC，使应用回退到 TCP。
        add ( "AND,((NETWORK,udp),(DST-PORT,443),(DOMAIN,drivefrontend-pa.clients6.google.com)),REJECT" );
    }

    // 4. 国内 AI、视频平台直连；国外 AI 必须优先于 Google / Microsoft 泛规则。
    add ( "DOMAIN-SUFFIX,deepseek.com,DIRECT" );
    add ( "GEOSITE,category-ai-cn,DIRECT" );
    add ( "DOMAIN-SUFFIX,bilibili.com,DIRECT" );
    add ( "GEOSITE,bilibili,DIRECT" );

    for ( const domain of OTHER_AI_DOMAINS )
        add ( "DOMAIN-SUFFIX," + domain + ",节点选择" );

    for ( const domain of [
        "openaiapi-site.azureedge.net",
        "openaicomproductionae4b.blob.core.windows.net",
        "production-openaicom-storage.azureedge.net"
    ] )
    {
        add ( "DOMAIN," + domain + ",GPT" );
    }

    add ( "GEOSITE,category-ai-!cn,节点选择" );

    // 5. 保留订阅例外，位置在服务类 GEOSITE 泛规则之前。
    for ( const original of config.rules || [] )
    {
        const rule = rewriteRule ( original, renamed );
        if ( !rule || /^PROCESS-NAME,fluxdownd\.exe,DIRECT$/i.test( rule ) )
            continue;
        if ( serverMode && /(?:^|\()PROCESS-(?:NAME|PATH)(?:-REGEX)?,/.test( rule ) )
            continue;
        if ( !/^GEOIP,CN,/i.test( rule ) && !/^GEOSITE,(?:cn|geolocation-!cn),/.test( rule ) )
            add ( rule );
    }

    // 6. 专用服务及开发者平台。
    add ( "GEOSITE,spotify,Spotify" );
    add ( "DOMAIN-SUFFIX,spotify.com,Spotify" );
    add ( "DOMAIN-SUFFIX,spotifycdn.com,Spotify" );
    add ( "GEOSITE,github,节点选择" );
    add ( "DOMAIN-SUFFIX,githubusercontent.com,节点选择" );
    add ( "GEOSITE,telegram,节点选择" );
    add ( "GEOSITE,discord,节点选择" );
    add ( "GEOSITE,youtube,谷歌服务" );
    add ( "GEOSITE,google,谷歌服务" );
    add ( "GEOSITE,microsoft,微软服务" );
    add ( "GEOSITE,apple,苹果服务" );

    for ( const domain of [
        "npmjs.com",
        "npmjs.org",
        "pypi.org",
        "pythonhosted.org",
        "crates.io",
        "rustup.rs"
    ] )
    {
        add ( "DOMAIN-SUFFIX," + domain + ",节点选择" );
    }

    // 7. 兜底始终在尾部，保证前面的自定义规则可达。
    add ( "GEOSITE,cn,DIRECT" );
    add ( "GEOIP,CN,DIRECT" );
    add ( "GEOSITE,geolocation-!cn,节点选择" );
    rules.push( "MATCH,漏网之鱼" );
    config.rules = rules;
}

function rewriteAuxiliaryReferences ( config, renamed, retain )
{
    function reference ( name )
    {
        if ( !name )
            return name;
        const result = renamed.get( name ) || renameGroup ( name );
        retain ( result );
        return result;
    }

    for ( const provider of Object.values( config[ "rule-providers" ] || {} ) )
    {
        if ( provider.proxy )
            provider.proxy = reference ( provider.proxy );
    }
    for ( const listener of [
        ...( config.listeners || [] ),
        ...( config.tunnels || [] )
    ] )
    {
        if ( listener.proxy )
            listener.proxy = reference ( listener.proxy );
    }
    for ( const key of Object.keys( config[ "sub-rules" ] || {} ) )
    {
        config[ "sub-rules" ][ key ] = config[ "sub-rules" ][ key ].map( function ( rule )
        {
            const rewritten = rewriteRule ( rule, renamed, true );
            if ( !/^SUB-RULE,/.test( rewritten ) )
                reference ( targetOfRule ( rewritten ) );
            return rewritten;
        } );
    }

    function dnsServers ( value )
    {
        if ( Array.isArray( value ) )
            return value.map( dnsServers );
        if ( typeof value !== "string" || !value.includes( "#" ) )
            return value;
        const index = value.indexOf( "#" );
        const parameters = value.slice( index + 1 ).split( "&" );
        parameters[ 0 ] = reference ( parameters[ 0 ] );
        return value.slice( 0, index + 1 ) + parameters.join( "&" );
    }
    for ( const key
              of [
                  "nameserver",
                  "fallback",
                  "default-nameserver",
                  "direct-nameserver",
                  "proxy-server-nameserver"
              ] )
    {
        if ( config.dns[ key ] )
            config.dns[ key ] = dnsServers ( config.dns[ key ] );
    }
    for ( const key of [
        "nameserver-policy",
        "proxy-server-nameserver-policy"
    ] )
    {
        for ( const domain of Object.keys( config.dns[ key ] || {} ) )
        {
            config.dns[ key ][ domain ] = dnsServers ( config.dns[ key ][ domain ] );
        }
    }
}

function validateReferences ( config )
{
    // 引用错误必须明确失败，不能通过删规则或删传输节点改变用户分流。
    const builtins = new Set ( [
        "DIRECT",
        "REJECT",
        "REJECT-DROP",
        "COMPATIBLE",
        "PASS"
    ] );
    const graph = new Map ();
    const nodes = new Set ( config.proxies.map( function ( node )
    {
        return node.name;
    } ) );
    const providers = config[ "proxy-providers" ] || {};
    for ( const entry of [
        ...config.proxies,
        ...config[ "proxy-groups" ]
    ] )
    {
        if ( graph.has( entry.name ) || builtins.has( entry.name ) )
        {
            throw new Error ( "策略或节点重名：" + entry.name );
        }
        graph.set( entry.name, [] );
    }

    function reference ( name, owner, edge )
    {
        if ( !name )
            return;
        if ( !builtins.has( name ) && !graph.has( name ) )
        {
            throw new Error ( owner + " 引用不存在或已过滤的节点/策略：" + name );
        }
        if ( edge && graph.has( name ) )
            graph.get( owner ).push( name );
    }

    for ( const node of config.proxies )
        reference ( node[ "dialer-proxy" ], node.name, true );
    for ( const group of config[ "proxy-groups" ] )
    {
        for ( const name of group.proxies || [] )
            reference ( name, group.name, true );
        reference ( group[ "empty-fallback" ], group.name, true );
        if ( graph.has( group[ "empty-fallback" ] ) && !nodes.has( group[ "empty-fallback" ] ) )
        {
            throw new Error ( group.name + " 的 empty-fallback 只能引用节点或内置策略" );
        }
        if ( group[ "include-all" ] || group[ "include-all-proxies" ] )
        {
            for ( const name of nodes )
                reference ( name, group.name, true );
        }
        for ( const name of group.use || [] )
        {
            if ( !providers[ name ] )
                throw new Error ( group.name + " 引用不存在的代理集合：" + name );
            const provider = providers[ name ];
            reference ( ( provider.override || {} )[ "dialer-proxy" ] || provider[ "dialer-proxy" ], group.name, true );
        }
        if ( !( group.proxies || [] ).length && !( group.use || [] ).length && !group[ "include-all" ] &&
             !group[ "include-all-proxies" ] && !group[ "include-all-providers" ] )
        {
            throw new Error ( "策略组没有可用成员：" + group.name );
        }
    }

    for ( const [ name, provider ] of Object.entries( providers ) )
    {
        reference ( provider.proxy, "代理集合 " + name );
        reference ( provider[ "dialer-proxy" ], "代理集合 " + name );
        reference ( ( provider.override || {} )[ "dialer-proxy" ], "代理集合 " + name );
        for ( const node of provider.payload || [] )
            reference ( node[ "dialer-proxy" ], "代理集合 " + name );
    }
    for ( const [ name, provider ] of Object.entries( config[ "rule-providers" ] || {} ) )
    {
        reference ( provider.proxy, "规则集合 " + name );
    }
    for ( const listener of [
        ...( config.listeners || [] ),
        ...( config.tunnels || [] )
    ] )
    {
        reference ( listener.proxy, "监听/隧道 " + ( listener.name || listener.listen ) );
    }

    const subrules = config[ "sub-rules" ] || {};
    for ( const rule of [
        ...config.rules,
        ...Object.values( subrules ).flat()
    ] )
    {
        const target = targetOfRule ( rule );
        if ( /^SUB-RULE,/.test( rule ) )
        {
            if ( !Object.prototype.hasOwnProperty.call( subrules, target ) )
            {
                throw new Error ( "规则引用不存在的子规则：" + target );
            }
        }
        else
            reference ( target, "规则 " + rule );
    }

    const visiting = new Set ();
    const visited = new Set ();
    function visit ( name )
    {
        if ( visited.has( name ) )
            return;
        if ( visiting.has( name ) )
            throw new Error ( "节点/策略循环依赖：" + name );
        visiting.add( name );
        for ( const next of graph.get( name ) || [] )
            visit ( next );
        visiting.delete( name );
        visited.add( name );
    }
    for ( const name of graph.keys() )
        visit ( name );

    if ( !nodes.size && !Object.keys( providers ).length )
    {
        throw new Error ( "覆写后没有剩余代理节点；请检查订阅或节点过滤条件" );
    }
}

function configureGeneral ( config, serverMode )
{
    if ( config[ "mixed-port" ] === undefined )
        config[ "mixed-port" ] = 7890;
    config.mode = "rule";
    config.ipv6 = config.proxies.some( function ( node )
    {
        return node[ "ip-version" ] === "ipv6" || String ( node.server || "" ).includes( ":" );
    } );
    config[ "tcp-concurrent" ] = true;
    config[ "unified-delay" ] = true;
    config[ "find-process-mode" ] = serverMode ? "off" : "strict";
    if ( config[ "log-level" ] === undefined )
        config[ "log-level" ] = "warning";
    if ( config[ "geo-auto-update" ] === undefined )
        config[ "geo-auto-update" ] = true;
    if ( config[ "geo-update-interval" ] === undefined )
        config[ "geo-update-interval" ] = 24;
    config[ "geox-url" ] = mergeObject ( {
        geoip : "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip-lite.dat",
        geosite : "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geosite.dat",
        mmdb : "https://fastly.jsdelivr.net/gh/MetaCubeX/meta-rules-dat@release/geoip.metadb",
        asn : "https://github.com/xishang0128/geoip/releases/download/latest/GeoLite2-ASN.mmdb"
    },
                                         config[ "geox-url" ] );
    config.profile = mergeObject ( config.profile, {
        tracing : false,
        "store-selected" : true,
        "store-fake-ip" :
            config.profile && config.profile[ "store-fake-ip" ] !== undefined ? config.profile[ "store-fake-ip" ] : true
    } );

    if ( serverMode )
    {
        delete config.port;
        delete config[ "socks-port" ];
        delete config[ "redir-port" ];
        delete config[ "tproxy-port" ];
        config[ "geodata-loader" ] = "memconservative";
        config[ "geosite-matcher" ] = "succinct";
    }
}

function main ( config, runtimeMode )
{
    const serverMode = runtimeMode === "__SERVER_GLOBAL__";
    const output = clone ( config || {} );
    const oldGroups = clone ( output[ "proxy-groups" ] || [] );
    const renamed = configureNodes ( output );
    configureProviders ( output, renamed );
    configureDns ( output );
    configureTun ( output );
    configureSniffer ( output );
    buildRules ( output, serverMode, renamed );
    configureGroups ( output, oldGroups, renamed );
    for ( const group of output[ "proxy-groups" ] )
    {
        if ( group.name === "谷歌服务" || group.name === "av" )
        {
            group.proxies = [ "SG出口" ];
            delete group[ "include-all" ];
            delete group[ "include-all-proxies" ];
            delete group[ "include-all-providers" ];
            delete group.use;
        }
    }
    validateReferences ( output );
    configureGeneral ( output, serverMode );

    return output;
}
