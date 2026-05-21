import React from 'react';

/* About — vertical highlighter strip down the centre of a pure-white
   viewport. 440px max-width text spine. Space Mono section header, Cormorant
   500 italic body at 1.55 line-height + 0.02em tracking. */
export default function AboutUs() {
  return (
    <main className="about-page">
      <section className="about-strip">
        <p className="about-eyebrow">About</p>
        <h1 className="about-title">The Chromatic Handoff</h1>
        <p className="about-body">
          In 1908, German horticulturist <strong><em>Gustav Krumbiegel</em></strong> composed Bangalore.
          Not a building. The whole city. In colour, month by month. One
          canopy handing off to the next, never once going dark between them.
          118 years later, through every layer of change, it is still in tune.
        </p>
        <p className="about-body">
          This started as a classroom project at India's National Institute of
          Design, a thread I simply couldn't let go. I began with the history,
          tracking down archive maps, books, and urban records. Yet, none of it
          captured the true feeling of the city in colour.
        </p>
        <p className="about-body">
          Krumbiegel wasn't just planting flowering trees; he was composing a
          symphony. He planted the precise contrast that would make each
          season land. The dark evergreen columns acting as a permanent wall
          to make March erupt, April gold feel like relief, and May red feel
          like intensity.
        </p>
        <p className="about-body">
          So we built this archive as one. Hoovugalu, the Kannada word for
          "flowers", is a first attempt at tracking that invisible clockwork.
          Designed by Gurpreet Kaur and built by Deepinder Singh, it is an
          interactive recording of a century-old chromatic handoff.
        </p>
        <p className="about-eyebrow about-eyebrow-section">Serial Blossoming in Context</p>
        <p className="about-body">
          To understand the scale of what Krumbiegel built in Bangalore, the
          platform maps his city-wide matrix alongside two milestones in
          serial planting history.
        </p>
        <p className="about-body">
          <strong><em>Gertrude Jekyll</em></strong> (The Garden Border). In
          1908 England, Gertrude Jekyll was arranging plants not by height or
          type, but by when they bloom. As one flower faded, the next opened.
          The border was never bare, always mid-sentence.
        </p>
        <p className="about-body">
          <strong><em>Piet Oudolf</em></strong> (The Public Pathway). A
          century later, Piet Oudolf brought this philosophy to Manhattan's
          High Line, weaving perennial species together so that the public
          elevated path always carries the eye forward, even in winter.
        </p>
        <p className="about-body">
          Bangalore stands as a monumental parallel, where the logic of a
          continuous color sequence was scaled across the public streets and
          avenues of an entire expanding urban grid, running as a city-wide
          grammar of overlapping bloom.
        </p>
        <p className="about-eyebrow about-eyebrow-section">Archival Sources</p>
        <ul className="about-sources">
          <li><em>Gertrude Jekyll</em> &nbsp;/&nbsp; Colour Schemes for the Flower Garden</li>
          <li><em>Piet Oudolf</em> &nbsp;/&nbsp; High Line and Lurie Garden</li>
          <li><em>T.P. Issar</em> &nbsp;/&nbsp; Blossoms of Bangalore</li>
          <li><em>Lancelot Hogben</em> &nbsp;/&nbsp; Bioaesthetic planning</li>
          <li><em>M.S. Randhawa</em> &nbsp;/&nbsp; Chandigarh's green landscape</li>
          <li><em>Gustav Hermann Krumbiegel</em> &nbsp;/&nbsp; Biography and landscaping legacy</li>
        </ul>
      </section>
    </main>
  );
}
