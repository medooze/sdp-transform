var fs = require('fs')
  , main = require(process.env.SDP_TRANSFORM_COV ? '../lib-cov' : '../')
  , parse = main.parse
  , write = main.write
  , parseFmtpConfig = main.parseFmtpConfig;

// some random sdp that keps having random attributes attached to it
// so we can test that the grammar works as intended
exports.normalSdp = function (t) {
  fs.readFile(__dirname + '/normal.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    //t.equal(session.identifier, '- 20518 0 IN IP4 203.0.113.1', 'identifier');
    t.equal(session.origin.username, '-', 'origin username');
    t.equal(session.origin.sessionId, 20518, 'origin sessionId');
    t.equal(session.origin.sessionVersion, 0, 'origin sessionVersion');
    t.equal(session.origin.netType, 'IN', 'origin netType');
    t.equal(session.origin.ipVer, 4, 'origin ipVer');
    t.equal(session.origin.address, '203.0.113.1', 'origin address');

    t.equal(session.connection.ip, '203.0.113.1', 'session connect ip');
    t.equal(session.connection.version, 4, 'session connect ip ver');

    // global ICE and fingerprint
    t.equal(session.iceUfrag, "F7gI", "global ufrag");
    t.equal(session.icePwd, "x9cml/YzichV2+XlhiMu8g", "global pwd");

    var audio = media[0];
    t.equal(audio.type, "audio", "audio type");
    t.equal(audio.port, 54400, "audio port");
    t.equal(audio.protocol, "RTP/SAVPF", "audio protocol");
    t.equal(audio.direction, "sendrecv", "audio direction");
    t.equal(audio.rtp[0].payload, 0, "audio rtp 0 payload");
    t.equal(audio.rtp[0].codec, "PCMU", "audio rtp 0 codec");
    t.equal(audio.rtp[0].rate, 8000, "audio rtp 0 rate");
    t.equal(audio.rtp[1].payload, 96, "audio rtp 1 payload");
    t.equal(audio.rtp[1].codec, "opus", "audio rtp 1 codec");
    t.equal(audio.rtp[1].rate, 48000, "audio rtp 1 rate");
    t.deepEqual(audio.ext[0], {
      value: 1,
      uri: "URI-toffset"
    }, "audio extension 0");
    t.deepEqual(audio.ext[1], {
      value: 2,
      direction: "recvonly",
      uri: "URI-gps-string"
    }, "audio extension 1");

    var video = media[1];
    t.equal(video.type, "video", "video type");
    t.equal(video.port, 55400, "video port");
    t.equal(video.protocol, "RTP/SAVPF", "video protocol");
    t.equal(video.direction, "sendrecv", "video direction");
    t.equal(video.rtp[0].payload, 97, "video rtp 0 payload");
    t.equal(video.rtp[0].codec, "H264", "video rtp 0 codec");
    t.equal(video.rtp[0].rate, 90000, "video rtp 0 rate");
    t.equal(video.fmtp[0].payload, 97, "video fmtp 0 payload");
    var vidFmtp = parseFmtpConfig(video.fmtp[0].config);
    t.equal(vidFmtp['profile-level-id'], "4d0028", "video fmtp 0 profile-level-id");
    t.equal(vidFmtp['packetization-mode'], 1, "video fmtp 0 packetization-mode");
    t.equal(vidFmtp['sprop-parameter-sets'], "Z0IAH5WoFAFuQA==,aM48gA==",
      "video fmtp 0 sprop-parameter-sets");
    t.equal(video.fmtp[1].payload, 111, "video fmtp 1 payload");
    var vidFmtp2 = parseFmtpConfig(video.fmtp[1].config);
    t.equal(vidFmtp2.minptime, 10, "video fmtp 1 minptime");
    t.equal(vidFmtp2.useinbandfec, 1, "video fmtp 1 useinbandfec");
    t.equal(video.rtp[1].payload, 98, "video rtp 1 payload");
    t.equal(video.rtp[1].codec, "VP8", "video rtp 1 codec");
    t.equal(video.rtp[1].rate, 90000, "video rtp 1 rate");
    t.equal(video.rtcpFb[0].payload, '*', "video rtcp-fb 0 payload");
    t.equal(video.rtcpFb[0].type, 'nack', "video rtcp-fb 0 type");
    t.equal(video.rtcpFb[1].payload, 98, "video rtcp-fb 0 payload");
    t.equal(video.rtcpFb[1].type, 'nack', "video rtcp-fb 0 type");
    t.equal(video.rtcpFb[1].subtype, 'rpsi', "video rtcp-fb 0 subtype");
    t.equal(video.rtcpFbTrrInt[0].payload, 98, "video rtcp-fb trr-int 0 payload");
    t.equal(video.rtcpFbTrrInt[0].value, 100, "video rtcp-fb trr-int 0 value");
    t.equal(video.crypto[0].id, 1, "video crypto 0 id");
    t.equal(video.crypto[0].suite, 'AES_CM_128_HMAC_SHA1_32', "video crypto 0 suite");
    t.equal(video.crypto[0].config, 'inline:keNcG3HezSNID7LmfDa9J4lfdUL8W1F7TNJKcbuy|2^20|1:32', "video crypto 0 config");
    t.equal(video.ssrcs.length, 2, "video got 2 ssrc lines");
    // test ssrc with attr:value
    t.deepEqual(video.ssrcs[0], {
      id: 1399694169,
      attribute: "foo",
      value: "bar"
    }, "video 1st ssrc line attr:value");
    // test ssrc with attr only
    t.deepEqual(video.ssrcs[1], {
      id: 1399694169,
      attribute: "baz",
    }, "video 2nd ssrc line attr only");

    // ICE candidates (same for both audio and video in this case)
    [audio.candidates, video.candidates].forEach(function (cs, i) {
      var str = (i === 0) ? "audio " : "video ";
      var port = (i === 0) ? 54400 : 55400;
      t.equal(cs.length, 4, str + "got 4 candidates");
      t.equal(cs[0].foundation, 0, str + "ice candidate 0 foundation");
      t.equal(cs[0].component, 1, str + "ice candidate 0 component");
      t.equal(cs[0].transport, "UDP", str + "ice candidate 0 transport");
      t.equal(cs[0].priority, 2113667327, str + "ice candidate 0 priority");
      t.equal(cs[0].ip, "203.0.113.1", str + "ice candidate 0 ip");
      t.equal(cs[0].port, port, str + "ice candidate 0 port");
      t.equal(cs[0].type, "host", str + "ice candidate 0 type");
      t.equal(cs[1].foundation, 1, str + "ice candidate 1 foundation");
      t.equal(cs[1].component, 2, str + "ice candidate 1 component");
      t.equal(cs[1].transport, "UDP", str + "ice candidate 1 transport");
      t.equal(cs[1].priority, 2113667326, str + "ice candidate 1 priority");
      t.equal(cs[1].ip, "203.0.113.1", str + "ice candidate 1 ip");
      t.equal(cs[1].port, port+1, str + "ice candidate 1 port");
      t.equal(cs[1].type, "host", str + "ice candidate 1 type");
      t.equal(cs[2].foundation, 2, str + "ice candidate 2 foundation");
      t.equal(cs[2].component, 1, str + "ice candidate 2 component");
      t.equal(cs[2].transport, "UDP", str + "ice candidate 2 transport");
      t.equal(cs[2].priority, 1686052607, str + "ice candidate 2 priority");
      t.equal(cs[2].ip, "203.0.113.1", str + "ice candidate 2 ip");
      t.equal(cs[2].port, port+2, str + "ice candidate 2 port");
      t.equal(cs[2].type, "srflx", str + "ice candidate 2 type");
      t.equal(cs[2].raddr, "192.168.1.145", str + "ice candidate 2 raddr");
      t.equal(cs[2].rport, port+2, str + "ice candidate 2 rport");
      t.equal(cs[2].generation, 0, str + "ice candidate 2 generation");
      t.equal(cs[2]['network-id'], 3, str + "ice candidate 2 network-id");
      t.equal(cs[2]['network-cost'], (i === 0 ? 10 : undefined), str + "ice candidate 2 network-cost");
      t.equal(cs[3].foundation, 3, str + "ice candidate 3 foundation");
      t.equal(cs[3].component, 2, str + "ice candidate 3 component");
      t.equal(cs[3].transport, "UDP", str + "ice candidate 3 transport");
      t.equal(cs[3].priority, 1686052606, str + "ice candidate 3 priority");
      t.equal(cs[3].ip, "203.0.113.1", str + "ice candidate 3 ip");
      t.equal(cs[3].port, port+3, str + "ice candidate 3 port");
      t.equal(cs[3].type, "srflx", str + "ice candidate 3 type");
      t.equal(cs[3].raddr, "192.168.1.145", str + "ice candidate 3 raddr");
      t.equal(cs[3].rport, port+3, str + "ice candidate 3 rport");
      t.equal(cs[3].generation, 0, str + "ice candidate 3 generation");
      t.equal(cs[3]['network-id'], 3, str + "ice candidate 3 network-id");
      t.equal(cs[3]['network-cost'], (i === 0 ? 10 : undefined), str + "ice candidate 3 network-cost");
    });

    t.equal(media.length, 2, "got 2 m-lines");

    t.done();
  });
};

/* Test for an sdp that started out as something from chrome
 * it's since been hacked to include tests for other stuff
 * ignore the name
 */
exports.hackySdp = function (t) {
  fs.readFile(__dirname + '/hacky.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    t.equal(session.origin.sessionId, '3710604898417546434', 'origin sessionId');
    t.ok(session.groups, "parsing session groups");
    t.equal(session.groups.length, 1, "one grouping");
    t.equal(session.groups[0].type, "BUNDLE", "grouping is BUNDLE");
    t.equal(session.groups[0].mids, "audio video", "bundling audio video");
    t.ok(session.msidSemantic, "have an msid semantic");
    t.equal(session.msidSemantic.semantic, "WMS", "webrtc semantic");
    t.equal(session.msidSemantic.token, "Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV", "semantic token");

    // verify a=rtcp:65179 IN IP4 193.84.77.194
    t.equal(media[0].rtcp.port, 1, 'rtcp port');
    t.equal(media[0].rtcp.netType, 'IN', 'rtcp netType');
    t.equal(media[0].rtcp.ipVer, 4, 'rtcp ipVer');
    t.equal(media[0].rtcp.address, '0.0.0.0', 'rtcp address');

    // verify ice tcp types
    t.equal(media[0].candidates[0].tcptype, null, 'no tcptype');
    t.equal(media[0].candidates[1].tcptype, 'active', 'active tcptype');
    t.equal(media[0].candidates[1].transport, 'tcp', 'tcp transport');
    t.equal(media[0].candidates[1].generation, 0, 'generation 0');
    t.equal(media[0].candidates[1].type, 'host', 'tcp host');
    t.equal(media[0].candidates[1].generation, '0', 'tcptype generation');
    t.equal(media[0].candidates[2].type, 'host', 'tcp host');
    t.equal(media[0].candidates[2].tcptype, 'active', 'active tcptype');
    t.equal(media[0].candidates[3].tcptype, 'passive', 'passive tcptype');
    t.equal(media[0].candidates[4].tcptype, 'so', 'so tcptype');
    // raddr + rport + tcptype + generation
    t.equal(media[0].candidates[5].type, 'srflx', 'tcp srflx');
    t.equal(media[0].candidates[5].rport, 9, 'tcp rport');
    t.equal(media[0].candidates[5].raddr, '10.0.1.1', 'tcp raddr');
    t.equal(media[0].candidates[5].tcptype, 'active', 'active tcptype');
    t.equal(media[0].candidates[6].tcptype, 'passive', 'passive tcptype');
    t.equal(media[0].candidates[6].rport, 8998, 'tcp rport');
    t.equal(media[0].candidates[6].raddr, '10.0.1.1', 'tcp raddr');
    t.equal(media[0].candidates[6].generation, 5, 'tcp generation');

    // and verify it works without specifying the ip
    t.equal(media[1].rtcp.port, 12312, 'rtcp port');
    t.equal(media[1].rtcp.netType, undefined, 'rtcp netType');
    t.equal(media[1].rtcp.ipVer, undefined, 'rtcp ipVer');
    t.equal(media[1].rtcp.address, undefined, 'rtcp address');

    // verify a=rtpmap:126 telephone-event/8000
    var lastRtp = media[0].rtp.length-1;
    t.equal(media[0].rtp[lastRtp].codec, 'telephone-event', 'dtmf codec');
    t.equal(media[0].rtp[lastRtp].rate, 8000, 'dtmf rate');


    t.equal(media[0].iceOptions, 'google-ice', "ice options parsed");
    t.equal(media[0].maxptime, 60, 'maxptime parsed');
    t.equal(media[0].rtcpMux, 'rtcp-mux', 'rtcp-mux present');

    t.equal(media[0].rtp[0].codec, 'opus', 'audio rtp 0 codec');
    t.equal(media[0].rtp[0].encoding, 2, 'audio rtp 0 encoding');

    t.ok(media[0].ssrcs, "have ssrc lines");
    t.equal(media[0].ssrcs.length, 4, "got 4 ssrc lines");
    var ssrcs = media[0].ssrcs;
    t.deepEqual(ssrcs[0], {
      id: 2754920552,
      attribute: "cname",
      value: "t9YU8M1UxTF8Y1A1"
    }, "1st ssrc line");

    t.deepEqual(ssrcs[1], {
      id: 2754920552,
      attribute: "msid",
      value: "Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlVa0"
    }, "2nd ssrc line");

    t.deepEqual(ssrcs[2], {
      id: 2754920552,
      attribute: "mslabel",
      value: "Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlV"
    }, "3rd ssrc line");

    t.deepEqual(ssrcs[3], {
      id: 2754920552,
      attribute: "label",
      value: "Jvlam5X3SX1OP6pn20zWogvaKJz5Hjf9OnlVa0"
    }, "4th ssrc line");

    // verify a=sctpmap:5000 webrtc-datachannel 1024
    t.ok(media[2].sctpmap, 'we have sctpmap');
    t.equal(media[2].sctpmap.sctpmapNumber, 5000, 'sctpmap number is 5000');
    t.equal(media[2].sctpmap.app, 'webrtc-datachannel', 'sctpmap app is webrtc-datachannel');
    t.equal(media[2].sctpmap.maxMessageSize, 1024, 'sctpmap maxMessageSize is 1024');

    t.done();
  });
};

exports.iceliteSdp = function (t) {
  fs.readFile(__dirname + '/icelite.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    t.equal(session.icelite, 'ice-lite', 'icelite parsed');

    var rew = write(session);
    t.ok(rew.indexOf("a=ice-lite\r\n") >= 0, "got ice-lite");
    t.ok(rew.indexOf("m=") > rew.indexOf("a=ice-lite"), 'session level icelite');
    t.done();
  });
};

exports.invalidSdp = function (t) {
  fs.readFile(__dirname + '/invalid.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    // verify a=rtcp:65179 IN IP4 193.84.77.194
    t.equal(media[0].rtcp.port, 1, 'rtcp port');
    t.equal(media[0].rtcp.netType, 'IN', 'rtcp netType');
    t.equal(media[0].rtcp.ipVer, 7, 'rtcp ipVer');
    t.equal(media[0].rtcp.address, 'X', 'rtcp address');
    t.equal(media[0].invalid.length, 1, 'found exactly 1 invalid line'); // f= lost
    t.equal(media[0].invalid[0].value, 'goo:hithere', 'copied verbatim');

    t.done();
  });
};

exports.jssipSdp = function (t) {
  fs.readFile(__dirname + '/jssip.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    var audio = media[0];
    var audCands = audio.candidates;
    t.equal(audCands.length, 6, '6 candidates');

    // testing ice optionals:
    t.deepEqual(audCands[0], {
        foundation: 1162875081,
        component: 1,
        transport: 'udp',
        priority: 2113937151,
        ip: '192.168.34.75',
        port: 60017,
        type: 'host',
        generation: 0
      }, "audio candidate 0"
    );
    t.deepEqual(audCands[2], {
        foundation: 3289912957,
        component: 1,
        transport: 'udp',
        priority: 1845501695,
        ip: '193.84.77.194',
        port: 60017,
        type: 'srflx',
        raddr: '192.168.34.75',
        rport: 60017,
        generation: 0
      }, "audio candidate 2 (raddr rport)"
    );
    t.deepEqual(audCands[4], {
        foundation: 198437945,
        component: 1,
        transport: 'tcp',
        priority: 1509957375,
        ip: '192.168.34.75',
        port: 0,
        type: 'host',
        generation: 0
      }, "audio candidate 4 (tcp)"
    );

    t.done();
  });
};


exports.jsepSdp = function (t) {
  fs.readFile(__dirname + '/jsep.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length === 2, "got media");

    var video = media[1];
    t.equal(video.ssrcGroups.length, 1, '1 ssrc grouping')
    t.deepEqual(video.ssrcGroups[0], {
        semantics: 'FID',
        ssrcs: '1366781083 1366781084'
      }, 'ssrc-group'
    );

    t.equal(video.msid,
      '61317484-2ed4-49d7-9eb7-1414322a7aae f30bdb4a-5db8-49b5-bcdc-e0c9a23172e0'
      , 'msid'
    );

    t.ok(video.rtcpRsize, 'rtcp-rsize present');

    // video contains 'a=end-of-candidates'
    // we want to ensure this comes after the candidate lines
    // so this is the only place we actually test the writer in here
    t.ok(video.endOfCandidates, "have end of candidates marker");
    var rewritten = write(session).split('\r\n');
    var idx = rewritten.indexOf('a=end-of-candidates');
    t.equal(rewritten[idx-1].slice(0, 11), 'a=candidate', 'marker after candidate');

    t.done();
  });
};

exports.alacSdp = function (t) {
  fs.readFile(__dirname + '/alac.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    var audio = media[0];
    t.equal(audio.type, "audio", "audio type");
    t.equal(audio.protocol, "RTP/AVP", "audio protocol");
    t.equal(audio.fmtp[0].payload, 96, "audio fmtp 0 payload");
    t.equal(audio.fmtp[0].config, "352 0 16 40 10 14 2 255 0 0 44100", "audio fmtp 0 config");
    t.equal(audio.rtp[0].payload, 96, "audio rtp 0 payload");
    t.equal(audio.rtp[0].codec, "AppleLossless", "audio rtp 0 codec");
    t.equal(audio.rtp[0].rate, undefined, "audio rtp 0 rate");
    t.equal(audio.rtp[0].encoding, undefined, "audio rtp 0 encoding");

    t.done();
  });
};

exports.onvifSdp = function (t) {
  fs.readFile(__dirname + '/onvif.sdp', function (err, sdp) {
    if (err) {
      t.ok(false, "failed to read file:" + err);
      t.done();
      return;
    }
    var session = parse(sdp+'');
    t.ok(session, "got session info");
    var media = session.media;
    t.ok(media && media.length > 0, "got media");

    var audio = media[0];
    t.equal(audio.type, "audio", "audio type");
    t.equal(audio.port, 0, "audio port");
    t.equal(audio.protocol, "RTP/AVP", "audio protocol");
    t.equal(audio.control, "rtsp://example.com/onvif_camera/audio", "audio control");
    t.equal(audio.payloads, 0, "audio payloads");

    var video = media[1];
    t.equal(video.type, "video", "video type");
    t.equal(video.port, 0, "video port");
    t.equal(video.protocol, "RTP/AVP", "video protocol");
    t.equal(video.control, "rtsp://example.com/onvif_camera/video", "video control");
    t.equal(video.payloads, 26, "video payloads");

    var application = media[2];
    t.equal(application.type, "application", "application type");
    t.equal(application.port, 0, "application port");
    t.equal(application.protocol, "RTP/AVP", "application protocol");
    t.equal(application.control, "rtsp://example.com/onvif_camera/metadata", "application control");
    t.equal(application.payloads, 107, "application payloads");
    t.equal(application.direction, "recvonly", "application direction");
    t.equal(application.rtp[0].payload, 107, "application rtp 0 payload");
    t.equal(application.rtp[0].codec, "vnd.onvif.metadata", "application rtp 0 codec");
    t.equal(application.rtp[0].rate, 90000, "application rtp 0 rate");
    t.equal(application.rtp[0].encoding, undefined, "application rtp 0 encoding");
    t.done();
  });
};
