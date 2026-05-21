import React from 'react';
import { NavIcon } from '../App.jsx';

/* About — vertical highlighter strip down the centre of a pure-white
   viewport. 440px max-width text spine. Space Mono section header, Cormorant
   500 italic body at 1.55 line-height + 0.02em tracking. */
export default function AboutUs() {
  return (
    <main className="about-page">
      <section className="about-strip">
        <p className="about-eyebrow">About Hoovugalu</p>
        <h1 className="about-title">The Chromatic Handoff</h1>
        <p className="about-body">
          In 1908, German horticulturist <strong><em>Gustav Krumbiegel</em></strong>{' '}
          composed Bangalore. Not with buildings, but with the whole city in
          color, month by month. One canopy handing off to the next, never
          once going dark between them. Over a century later, through every
          layer of change, it is still in tune.
        </p>
        <p className="about-body">
          This started as a classroom project at India's National Institute
          of Design, a thread I simply couldn't let go. I began with the
          history, tracking down archive maps, books, and urban records.
          Yet, none of it captured the true feeling of the city in color.
        </p>
        <p className="about-body">
          Krumbiegel wasn't just planting flowering trees; he was composing
          a symphony. He engineered the precise contrasts that would make
          each season land: the dark evergreen columns acting as a permanent
          visual wall to make March erupt, April gold feel like relief, and
          May red feel like intensity.
        </p>
        <p className="about-body">
          Hoovugalu, the Kannada word for "flowers," explores that
          invisible clockwork. Designed and built by Gurpreet Kaur and
          Deepinder Singh, it is an interactive recording of a century-old
          chromatic handoff.
        </p>

        <p className="about-eyebrow about-eyebrow-section">The Viewports</p>
        <p className="about-body">
          The project unfolds the rhythm of the programmed streets across
          three distinct interactive lenses.
        </p>

        <div className="about-viewport-head">
          <span className="about-viewport-icon"><NavIcon kind="soundscape" /></span>
          <h3 className="about-viewport-title">Soundscape</h3>
        </div>
        <p className="about-body about-viewport-tagline">
          A translation of the city in sound.
        </p>
        <p className="about-body">
          The colors of the active blooming trees are mapped directly to
          musical notes, woven together with the specific weather and bird
          songs you can hear during that month into a continuous score.
          Press Play to start the score, then drag the Timeline Slider to
          watch and hear the canopy shift month by month.
        </p>

        <div className="about-viewport-head">
          <span className="about-viewport-icon"><NavIcon kind="wheel" /></span>
          <h3 className="about-viewport-title">The Bloom Calendar</h3>
        </div>
        <p className="about-body about-viewport-tagline">
          A visual clock of seasonal contrasts.
        </p>
        <p className="about-body">
          This layout showcases how Krumbiegel created deliberate color
          contrasts across each month. A rotating lens traces a continuous
          layout with no gap months, ensuring there is always a tree in
          bloom. Tap and sweep around the circular dial to focus on a
          season, and use the Filter Pills to compare his layout with
          modern landscapes.
        </p>

        <div className="about-viewport-head">
          <span className="about-viewport-icon"><NavIcon kind="loop" /></span>
          <h3 className="about-viewport-title">The Loop</h3>
        </div>
        <p className="about-body about-viewport-tagline">
          A historical timeline matrix.
        </p>
        <p className="about-body">
          This view places the serial blossom windows of each month across
          every year from 1908 to create a massive Bangalore tapestry,
          showing how these shifting colors and green canopies earned
          Bangalore its title as the "Garden City." The full grid operates
          as a generative, interactive soundboard. Tap any pixel coordinate
          on the grid to trigger its sound profile, and open the Glass
          Detail Drawer to read that tree's localized history.
        </p>

        <p className="about-eyebrow about-eyebrow-section">Serial Blossoming in Context</p>
        <p className="about-body">
          To understand the scale of what Krumbiegel built in Bangalore,
          the platform maps his city-wide matrix alongside two major
          milestones in serial planting history.
        </p>
        <p className="about-body">
          <strong><em>Gertrude Jekyll</em></strong> (The Garden Border). In
          1908 England, Gertrude Jekyll was arranging plants not by height
          or type, but by when they bloom. As one flower faded, the next
          opened. The border was never bare, always mid-sentence.
        </p>
        <p className="about-body">
          <strong><em>Piet Oudolf</em></strong> (The Public Pathway). A
          century later, Piet Oudolf brought this philosophy to Manhattan's
          High Line, weaving perennial species together so that the public
          elevated path always carries the eye forward, even in winter.
        </p>
        <p className="about-body">
          Bangalore stands as a monumental parallel, where the logic of a
          continuous color sequence was scaled across the public streets
          and avenues of an entire expanding urban grid, running as a
          city-wide grammar of overlapping blooms.
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
