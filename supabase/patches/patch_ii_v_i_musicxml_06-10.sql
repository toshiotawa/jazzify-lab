-- patch music_xml + production_start_key for range 6-10
UPDATE public.fantasy_stages
SET
  music_xml = $musicxml$<?xml version='1.0' encoding='utf-8'?>
<score-partwise version="3.1">
  <identification>
    <rights>©</rights>
    <encoding>
      <software>Finale v26.3 for Windows</software>
      <encoding-date>2026-03-24</encoding-date>
      <supports attribute="new-system" element="print" type="yes" value="yes" />
      <supports attribute="new-page" element="print" type="yes" value="yes" />
      <supports element="accidental" type="yes" />
      <supports element="beam" type="yes" />
      <supports element="stem" type="yes" />
    </encoding>
  </identification>
  <defaults>
    <scaling>
      <millimeters>6.9674</millimeters>
      <tenths>40</tenths>
    </scaling>
    <page-layout>
      <page-height>1705</page-height>
      <page-width>1206</page-width>
      <page-margins type="both">
        <left-margin>86</left-margin>
        <right-margin>86</right-margin>
        <top-margin>86</top-margin>
        <bottom-margin>47</bottom-margin>
      </page-margins>
    </page-layout>
    <system-layout>
      <system-margins>
        <left-margin>57</left-margin>
        <right-margin>0</right-margin>
      </system-margins>
      <system-distance>122</system-distance>
      <top-system-distance>73</top-system-distance>
    </system-layout>
    <appearance>
      <line-width type="stem">1.0417</line-width>
      <line-width type="beam">5</line-width>
      <line-width type="staff">0.944</line-width>
      <line-width type="light barline">1.4583</line-width>
      <line-width type="heavy barline">5</line-width>
      <line-width type="leger">1.4583</line-width>
      <line-width type="ending">1.0417</line-width>
      <line-width type="wedge">1.25</line-width>
      <line-width type="enclosure">0.944</line-width>
      <line-width type="tuplet bracket">1.25</line-width>
      <note-size type="grace">75</note-size>
      <note-size type="cue">75</note-size>
      <distance type="hyphen">60</distance>
      <distance type="beam">7.5</distance>
    </appearance>
    <music-font font-family="Kousaku,engraved" font-size="19.75" />
    <word-font font-family="ＭＳ 明朝" font-size="9.9" />
  </defaults>
  <credit page="1">
    <credit-type>rights</credit-type>
    <credit-words default-x="603" default-y="28" font-family="Times New Roman" font-size="10" justify="center" valign="bottom">©</credit-words>
  </credit>
  <credit page="2">
    <credit-type>page number</credit-type>
    <credit-words default-x="603" default-y="28" font-size="12" halign="center" valign="bottom">- 2 -</credit-words>
  </credit>
  <credit page="3">
    <credit-type>page number</credit-type>
    <credit-words default-x="603" default-y="28" font-size="12" halign="center" valign="bottom">- 3 -</credit-words>
  </credit>
  <credit page="4">
    <credit-type>page number</credit-type>
    <credit-words default-x="603" default-y="28" font-size="12" halign="center" valign="bottom">- 4 -</credit-words>
  </credit>
  <credit page="5">
    <credit-type>page number</credit-type>
    <credit-words default-x="603" default-y="28" font-size="12" halign="center" valign="bottom">- 5 -</credit-words>
  </credit>
  <part-list>
    <score-part id="P1">
      <part-name print-object="no">MusicXML Part</part-name>
      <score-instrument id="P1-I1">
        <instrument-name>SmartMusic SoftSynth</instrument-name>
        <virtual-instrument />
      </score-instrument>
      <midi-device>SmartMusic SoftSynth</midi-device>
      <midi-instrument id="P1-I1">
        <midi-channel>1</midi-channel>
        <midi-bank>15489</midi-bank>
        <midi-program>1</midi-program>
        <volume>80</volume>
        <pan>0</pan>
      </midi-instrument>
    </score-part>
  </part-list>
  <part id="P1">
    <measure number="1" width="306">
      <print new-system="yes">
        <system-layout>
          <system-distance>113</system-distance>
        </system-layout>
      </print>
      <barline location="left">
        <repeat direction="forward" winged="none" />
      </barline>
      <attributes>
        <divisions>12</divisions>
        <key>
          <fifths>0</fifths>
          <mode>major</mode>
        </key>
        <time symbol="common">
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <sound tempo="160" />
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>D</root-step>
        </root>
        <kind halign="center" text="m7">minor-seventh</kind>
      </harmony>
      <note default-x="81">
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="104">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="129">
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="161">
        <pitch>
          <step>F</step>
          <alter>1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>sharp</accidental>
        <stem default-y="0">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="185">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="216">
        <pitch>
          <step>G</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="247">
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>natural</accidental>
        <stem default-y="5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="272">
        <pitch>
          <step>A</step>
          <octave>3</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="2" width="242">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>G</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note default-x="17">
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="44">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="72">
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="98">
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-5">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="126">
        <pitch>
          <step>B</step>
          <octave>3</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="154">
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="3">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="181">
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="7">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="208">
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="10.5">up</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="3" width="179">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>C</root-step>
        </root>
        <kind halign="center" text="M7">major-seventh</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
        <stem default-y="5">up</stem>
      </note>
      <note default-x="58">
        <rest />
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <note default-x="96">
        <rest />
        <duration>24</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
    </measure>
    <measure number="4" width="250">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>A</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note default-x="17">
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="15">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="41">
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>3</duration>
        <voice>1</voice>
        <type>16th</type>
        <stem default-y="13">up</stem>
        <beam number="1">continue</beam>
        <beam number="2">begin</beam>
      </note>
      <note default-x="70">
        <pitch>
          <step>A</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>3</duration>
        <voice>1</voice>
        <type>16th</type>
        <accidental>flat</accidental>
        <stem default-y="10.5">up</stem>
        <beam number="1">end</beam>
        <beam number="2">end</beam>
      </note>
      <note default-x="89">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="113">
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="136">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="160">
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-10">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="192">
        <pitch>
          <step>C</step>
          <alter>1</alter>
          <octave>4</octave>
        </pitch>
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
        <accidental>sharp</accidental>
        <stem default-y="-15">up</stem>
      </note>
      <barline location="right">
        <bar-style>heavy-heavy</bar-style>
        <repeat direction="backward" winged="none" />
      </barline>
    </measure>
    <measure number="5" width="330">
      <print new-system="yes">
        <system-layout>
          <system-distance>113</system-distance>
        </system-layout>
      </print>
      <barline location="left">
        <repeat direction="forward" winged="none" />
      </barline>
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>D</root-step>
        </root>
        <kind halign="center" text="m7">minor-seventh</kind>
      </harmony>
      <note default-x="81">
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="109">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="137">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="170">
        <pitch>
          <step>G</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="5">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="198">
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="228">
        <pitch>
          <step>A</step>
          <octave>3</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-3">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="262">
        <pitch>
          <step>G</step>
          <alter>1</alter>
          <octave>3</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>sharp</accidental>
        <stem default-y="-6.5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="294">
        <pitch>
          <step>A</step>
          <octave>3</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-10">up</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="6" width="252">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>G</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
        <stem default-y="-5">up</stem>
      </note>
      <note default-x="63">
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-10">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="93">
        <pitch>
          <step>C</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-15">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="124">
        <pitch>
          <step>B</step>
          <octave>3</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="154">
        <pitch>
          <step>D</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="4">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="184">
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="7">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="214">
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="10">up</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="7" width="240">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>C</root-step>
        </root>
        <kind halign="center" text="M7">major-seventh</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="44">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="1.5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="74">
        <pitch>
          <step>B</step>
          <octave>3</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-1.5">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="105">
        <pitch>
          <step>G</step>
          <octave>3</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-5">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="135">
        <pitch>
          <step>A</step>
          <octave>3</octave>
        </pitch>
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
        <stem default-y="-20">up</stem>
      </note>
      <note default-x="185">
        <rest />
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
    </measure>
    <measure number="8" width="155">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>A</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note>
        <rest measure="yes" />
        <duration>48</duration>
        <voice>1</voice>
      </note>
      <barline location="right">
        <bar-style>heavy-heavy</bar-style>
        <repeat direction="backward" winged="none" />
      </barline>
    </measure>
    <measure number="9" width="343">
      <print new-system="yes">
        <system-layout>
          <system-distance>113</system-distance>
        </system-layout>
      </print>
      <barline location="left">
        <repeat direction="forward" winged="none" />
      </barline>
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>D</root-step>
        </root>
        <kind halign="center" text="m7">minor-seventh</kind>
      </harmony>
      <note default-x="81">
        <rest />
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
      </note>
      <note default-x="112">
        <pitch>
          <step>D</step>
          <alter>1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>sharp</accidental>
        <stem default-y="-45">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="144">
        <pitch>
          <step>E</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-40">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="177">
        <pitch>
          <step>G</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-35">down</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="209">
        <pitch>
          <step>F</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-65">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="241">
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-65">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="272">
        <pitch>
          <step>G</step>
          <alter>1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>sharp</accidental>
        <stem default-y="-65">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="305">
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-65">down</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="10" width="264">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>G</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>E</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-40">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="46">
        <pitch>
          <step>G</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-43">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="78">
        <pitch>
          <step>E</step>
          <alter>-1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="-47">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="110">
        <pitch>
          <step>C</step>
          <alter>-1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="-50">down</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="142">
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
        <accidental>flat</accidental>
        <stem default-y="-55">down</stem>
      </note>
      <note default-x="194">
        <pitch>
          <step>A</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="10.5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="226">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <tie type="start" />
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5.5">up</stem>
        <beam number="1">end</beam>
        <notations>
          <tied type="start" />
        </notations>
      </note>
    </measure>
    <measure number="11" width="207">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>C</root-step>
        </root>
        <kind halign="center" text="M7">major-seventh</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>12</duration>
        <tie type="stop" />
        <voice>1</voice>
        <type>quarter</type>
        <stem default-y="5.5">up</stem>
        <notations>
          <tied type="stop" />
        </notations>
      </note>
      <note default-x="65">
        <rest />
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <note default-x="112">
        <rest />
        <duration>24</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
    </measure>
    <measure number="12" width="162">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>A</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note>
        <rest measure="yes" />
        <duration>48</duration>
        <voice>1</voice>
      </note>
      <barline location="right">
        <bar-style>heavy-heavy</bar-style>
        <repeat direction="backward" winged="none" />
      </barline>
    </measure>
    <measure number="13" width="300">
      <print new-system="yes">
        <system-layout>
          <system-distance>113</system-distance>
        </system-layout>
      </print>
      <barline location="left">
        <repeat direction="forward" winged="none" />
      </barline>
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>D</root-step>
        </root>
        <kind halign="center" text="m7">minor-seventh</kind>
      </harmony>
      <note default-x="81">
        <rest />
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
      </note>
      <note default-x="112">
        <pitch>
          <step>D</step>
          <alter>1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>sharp</accidental>
        <stem default-y="-5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="138">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="164">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="190">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-5">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="216">
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="0">up</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="242">
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-60">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="268">
        <pitch>
          <step>C</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-50">down</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="14" width="234">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>G</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>E</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-45">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="37">
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-48">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="70">
        <pitch>
          <step>C</step>
          <alter>1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>sharp</accidental>
        <stem default-y="-52">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="94">
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-55">down</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="125">
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="15">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="155">
        <pitch>
          <step>A</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="11">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="179">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="8">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="203">
        <pitch>
          <step>F</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="5">up</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="15" width="223">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>C</root-step>
        </root>
        <kind halign="center" text="M7">major-seventh</kind>
      </harmony>
      <note default-x="13">
        <pitch>
          <step>E</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="15">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="40">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="18">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="67">
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="22">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="93">
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <tie type="start" />
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="25.5">up</stem>
        <beam number="1">end</beam>
        <notations>
          <tied type="start" />
        </notations>
      </note>
      <note default-x="120">
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>12</duration>
        <tie type="stop" />
        <voice>1</voice>
        <type>quarter</type>
        <stem default-y="-45">down</stem>
        <notations>
          <tied type="stop" />
        </notations>
      </note>
      <note default-x="163">
        <pitch>
          <step>D</step>
          <alter>-1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="-45">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="190">
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-55">down</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="16" width="219">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>A</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>C</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="20">up</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="39">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="19">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="65">
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="17">up</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="97">
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <tie type="start" />
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="15">up</stem>
        <beam number="1">end</beam>
        <notations>
          <tied type="start" />
        </notations>
      </note>
      <note default-x="123">
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>4</octave>
        </pitch>
        <duration>12</duration>
        <tie type="stop" />
        <voice>1</voice>
        <type>quarter</type>
        <stem default-y="-55">down</stem>
        <notations>
          <tied type="stop" />
        </notations>
      </note>
      <note default-x="159">
        <rest />
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
      </note>
      <barline location="right">
        <bar-style>heavy-heavy</bar-style>
        <repeat direction="backward" winged="none" />
      </barline>
    </measure>
    <measure number="17" width="304">
      <print new-system="yes">
        <system-layout>
          <system-distance>113</system-distance>
        </system-layout>
      </print>
      <barline location="left">
        <repeat direction="forward" winged="none" />
      </barline>
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>D</root-step>
        </root>
        <kind halign="center" text="m7">minor-seventh</kind>
      </harmony>
      <note default-x="85">
        <pitch>
          <step>D</step>
          <alter>1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>sharp</accidental>
        <stem default-y="-45">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="110">
        <pitch>
          <step>E</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-42">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="136">
        <pitch>
          <step>G</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-39">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="167">
        <pitch>
          <step>G</step>
          <alter>-1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="-35">down</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="192">
        <pitch>
          <step>F</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-40">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="217">
        <pitch>
          <step>E</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-43">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="248">
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>natural</accidental>
        <stem default-y="-47">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="273">
        <pitch>
          <step>C</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-50">down</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="18" width="242">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>G</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-55">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="36">
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-52">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="59">
        <pitch>
          <step>F</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-48">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="81">
        <pitch>
          <step>G</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-45">down</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="112">
        <pitch>
          <step>A</step>
          <alter>-1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>flat</accidental>
        <stem default-y="-25">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="145">
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>5</octave>
        </pitch>
        <duration>3</duration>
        <voice>1</voice>
        <type>16th</type>
        <accidental>flat</accidental>
        <stem default-y="-25">down</stem>
        <beam number="1">continue</beam>
        <beam number="2">begin</beam>
      </note>
      <note default-x="169">
        <pitch>
          <step>A</step>
          <alter>-1</alter>
          <octave>5</octave>
        </pitch>
        <duration>3</duration>
        <voice>1</voice>
        <type>16th</type>
        <stem default-y="-25">down</stem>
        <beam number="1">end</beam>
        <beam number="2">end</beam>
      </note>
      <note default-x="191">
        <pitch>
          <step>G</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-30">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="214">
        <pitch>
          <step>F</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-35">down</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="19" width="234">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>C</root-step>
        </root>
        <kind halign="center" text="M7">major-seventh</kind>
      </harmony>
      <note default-x="14">
        <pitch>
          <step>E</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-65">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="41">
        <pitch>
          <step>G</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-65">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="67">
        <pitch>
          <step>A</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-65">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="94">
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-65">down</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="121">
        <pitch>
          <step>B</step>
          <octave>4</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-55">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="147">
        <pitch>
          <step>C</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-52">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="174">
        <pitch>
          <step>E</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-48">down</stem>
        <beam number="1">continue</beam>
      </note>
      <note default-x="201">
        <pitch>
          <step>G</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-45">down</stem>
        <beam number="1">end</beam>
      </note>
    </measure>
    <measure number="20" width="195">
      <harmony default-y="32" font-family="Arial" font-size="13.3">
        <root>
          <root-step>A</root-step>
        </root>
        <kind halign="center" text="7">dominant</kind>
      </harmony>
      <note default-x="17">
        <pitch>
          <step>B</step>
          <alter>-1</alter>
          <octave>5</octave>
        </pitch>
        <duration>12</duration>
        <voice>1</voice>
        <type>quarter</type>
        <accidental>flat</accidental>
        <stem default-y="-20">down</stem>
      </note>
      <note default-x="55">
        <pitch>
          <step>D</step>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <stem default-y="-45">down</stem>
        <beam number="1">begin</beam>
      </note>
      <note default-x="88">
        <pitch>
          <step>C</step>
          <alter>1</alter>
          <octave>5</octave>
        </pitch>
        <duration>6</duration>
        <voice>1</voice>
        <type>eighth</type>
        <accidental>sharp</accidental>
        <stem default-y="-50">down</stem>
        <beam number="1">end</beam>
      </note>
      <note default-x="111">
        <rest />
        <duration>24</duration>
        <voice>1</voice>
        <type>half</type>
      </note>
      <barline location="right">
        <bar-style>heavy-heavy</bar-style>
        <repeat direction="backward" winged="none" />
      </barline>
    </measure>
  </part>
</score-partwise>$musicxml$,
  production_start_key = CASE id
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-6-10') THEN 0
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-6-10') THEN 5
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-6-10') THEN -2
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-6-10') THEN 3
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-6-10') THEN -4
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-6-10') THEN 1
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-6-10') THEN 6
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-6-10') THEN -1
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-6-10') THEN 4
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-6-10') THEN -3
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-6-10') THEN 2
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-6-10') THEN -5
    ELSE production_start_key
  END
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-6-10')
);
