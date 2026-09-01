---
layout: archive
title: "Research"   
permalink: /Research/   
author_profile: true
---

<style>
/* --- Collapsible “theme” blocks --- */
.theme { margin: 1.25rem 0; border: 1px solid var(--global-border-color); border-radius: 10px; background: var(--global-bg-color); }
.theme > summary {
  /* clickable header row */
  cursor: pointer; list-style: none; padding: 12px 14px; font-weight: 600;
  display: flex; align-items: center; gap: 10px;
}
.theme > summary::-webkit-details-marker { display: none; } /* hide default marker */
.theme .chev { transition: transform .2s ease; }
.theme[open] .chev { transform: rotate(90deg); }

/* --- One left-image / right-text row (your “table”) --- */
.rcard {
  display: flex; gap: 16px; padding: 14px; border-top: 1px solid var(--global-border-color);
}
.rcard:first-of-type { border-top: 1px solid var(--global-border-color); }

/* image column */
.rcard .img img {
  width: 180px; max-width: 35vw; height: auto;
  border: 1px solid var(--global-border-color); border-radius: 8px;
}

/* text column */
.rcard .txt { flex: 1; line-height: 1.55; font-size: 16px; }
.rcard .txt h4 { margin: 0 0 6px 0; font-size: 18px; }

/* link buttons */
.rcard .links a,
.rcard .links span.btn {
  margin-right: 10px;
}

/* mobile */
@media (max-width: 720px) {
  .rcard { flex-direction: column; }
  .rcard .img img { width: 100%; max-width: 100%; }
}

</style>

Below is an introduction of my research by topics. You can find my published papers and preprints on my [Google Scholar](https://scholar.google.com/citations?user=UCWX53IAAAAJ&hl=en&inst=5778974199078678248) page or a broader list of research projects in my [CV](https://yuanzeliu.github.io/CV/).


<!-- ===== Theme 1: Why We Became Who We Are ===== -->
<details class="theme">
  <summary><span class="chev">▶</span> Why We Became Who We Are</summary>

  <!-- 3) FACT model of trait language -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_fact_model.png" alt="FACT model of trait language">
    </div>
    <div class="txt">
      <h4>The content, structure, and history of English trait words</h4>
      <p>
        Using large language models and human ratings from 3,070 English speakers, we map 2,847 trait words and uncover a four-factor structure—Fitness, Agency, Communion, Traditionalism (FACT)—that covers more of trait space than the Big Five (96% vs. 79%). The FACT dimensions differ in semantic coherence, valence, and historical trajectories (e.g., Communion converging, Agency diverging), indicating that trait language evolves adaptively with social life—optimizing interpersonal description and evaluation as cultural ecologies change.
      </p>
      <p class="citation">
        <strong>Liu, Y.</strong>, Charlesworth, T., Koch, A., Luttrell, A., & Jackson, J. (R&amp;R).
        The content, structure, and history of English trait words.
        <em>Journal of Personality and Social Psychology</em>.
      </p>
      <p class="links">
        <a class="btn btn--light btn--sm" href="https://doi.org/10.31234/osf.io/7qkg8_v1">Preprint</a>
        <a class="btn btn--light btn--sm" href="https://yuanzeliu.github.io/assets/trait-network/">Interactive App</a>
      </p>
    </div>
  </div>

  <!-- 4) Prejudice & state centralization -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_PredjudiceState.png" alt="Prejudice and state centralization">
    </div>
    <div class="txt">
      <h4>Prejudice tied to state centralization in historical societies</h4>
      <p>
        Across 389 ethnographies from 90 societies and centuries of Chinese historical records (206 BCE–1911 CE), we show that prejudice rises with state centralization—but not with environmental threat, pathogens, or warfare. Horizontal (group dislike) and vertical (superiority) prejudice both intensify under centralized governance and recede when governance decentralizes, suggesting that prejudice co-evolves with social structure rather than reflecting fixed human nature.
      </p>
      <p class="citation">
        Dillion, D., <strong>Liu, Y.</strong>, Chen, Y., Watts, J., Zhao, C., Baral, S., Bucker, W., Atari, M.,
        Kteily, N., & Jackson, J. (under review).
        Prejudice tied to state centralization in historical societies.
        <em>Nature Communications</em>.
      </p>
      <p class="links">
        <a class="btn btn--light btn--sm" href="https://doi.org/10.31234/osf.io/zxuth">Preprint</a>
      </p>
    </div>
  </div>

  <!-- 5) Cultural attachment -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_cultural_attachment.png" alt="Cultural attachment styles">
    </div>
    <div class="txt">
      <h4>The profiles, predictors, and intergroup outcomes of cultural attachment</h4>
      <p>
        We introduce cultural attachment styles—secure, preoccupied, dismissing, and fearful—as socio-psychological adaptations shaped by societal context, interpersonal history, and individual differences. Across two studies (n₁=328; n₂=1,317), secure cultural attachment predicts less out-group threat, more identity inclusiveness, lower bias, more intergroup contact, and better psychological functioning—independent of general/place attachment—clarifying pathways by which cultures adapt to globalization.
      </p>
      <p class="citation">
        <strong>Liu, Y.</strong>, Hou, Y., & Hong, Y.-y. (2025).
        The profiles, predictors, and intergroup outcomes of cultural attachment.
        <em>Personality and Social Psychology Bulletin</em>.
      </p>
      <p class="links">
        <a class="btn btn--light btn--sm" href="https://journals.sagepub.com/doi/epub/10.1177/01461672231190753">Journal</a>
        <a class="btn btn--primary btn--sm" href="/files/cultural_attachment.pdf">PDF</a>
      </p>
    </div>
  </div>

  <!-- 6) Income & cultural variation -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_income_values.png" alt="Income and cultural values">
    </div>
    <div class="txt">
      <h4>Cultural variation in values is greatest among higher income groups</h4>
      <p>
        This working paper examines whether income changes the degree to which people reflect local cultural norms. Using global and U.S. regional datasets, we study whether higher-income groups converge toward a common set of values or become more differentiated across cultural contexts.
      </p>
      <p class="citation">
        Medvedev, D., <strong>Liu, Y.</strong>, Talhelm, T., & Jackson, J. (writing).
        Cultural variation in values is greatest among higher income groups.
      </p>
      <p class="links">
        <span class="btn btn--light btn--sm">Available upon request</span>
      </p>
    </div>
  </div>

  <!-- 8) LLM value measurement tool -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_value_tool.png" alt="LLM-based value measurement">
    </div>
    <div class="txt">
      <h4>Scaling cross-national measurement of political values in parliamentary speeches</h4>
      <p>
        We are developing an LLM-based framework for annotating political values in parliamentary speeches across countries. The project evaluates whether major theories of values can be integrated into a scalable approach for studying how elite value expression varies across societies and over time.
      </p>
      <p class="citation">
        Zhang, H., Bai, R., <strong>Liu, Y.</strong>, & Jackson, J. (writing).
        Scaling cross-national measurement of political values in parliamentary speeches using large language models.
      </p>
      <p class="links">
        <span class="btn btn--light btn--sm">Available upon request</span>
      </p>
    </div>
  </div>

</details>

<!-- ===== Theme 2: When Evolution Misfires ===== -->
<details class="theme">
  <summary><span class="chev">▶</span> When Evolution Misfires</summary>

  <!-- 9) AI prioritization problem -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_ai_prioritization.png" alt="AI prioritization problem">
    </div>
    <div class="txt">
      <h4>Large AI models have a prioritization problem: Policy implications and solutions</h4>
      <p>
        Large AI models must prioritize some information over others in training, yet optimization goals often misalign with the common good, creating a prioritization problem. This bias—favoring engagement over accuracy or dominant cultural voices over diversity—can distort collective knowledge and cultural evolution, but can be mitigated through improved data, objectives, and institutional safeguards.
      </p>
      <p class="citation">
        Jackson, J.*, <strong>Liu, Y.*</strong>, Wang, Z., & Brady, W. (2025).
        Large AI models have a prioritization problem: Policy implications and solutions.
        <em>Policy Insights from the Behavioral and Brain Sciences</em>.
      </p>
      <p class="links">
        <a class="btn btn--light btn--sm" href="https://journals.sagepub.com/doi/10.1177/23727322251408311">Journal</a>
        <a class="btn btn--primary btn--sm" href="/files/jackson-et-al-2025-large-ai-models-have-a-prioritization-problem-policy-implications-and-solutions.pdf">PDF</a>
      </p>
    </div>
  </div>

  <!-- 10) Civil rights polarization -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_CivilRights.png" alt="Civil rights polarization">
    </div>
    <div class="txt">
      <h4>The widening partisan gap in legislative support for civil rights in the United States</h4>
      <p>
        Analyzing six decades of U.S. bill language, “civil rights” becomes both more common and more party-polarized, with accelerations in the early 1990s and mid-2010s. As civil-rights issues (race, gender, LGBTQ+) tighten their coupling to party identity—especially amid Black Lives Matter—legislative agendas encode issue polarization, creating conditions for institutional conflict and policy malfunction.
      </p>
      <p class="citation">
        Jackson, J. C., <strong>Liu, Y.</strong>, & Kteily, N. S. (2026).
        The widening partisan gap in legislative support for civil rights in the United States.
        <em>Nature Communications</em>.
      </p>
      <p class="links">
        <a class="btn btn--light btn--sm" href="https://www.nature.com/articles/s41467-026-73607-x">Journal</a>
      </p>
    </div>
  </div>

  <!-- 11) Neoliberalism & COVID responses -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_neoliberalism_covid.png" alt="Neoliberalism and COVID responses">
    </div>
    <div class="txt">
      <h4>Neoliberalism and governmental and individual responses to COVID-19</h4>
      <p>
        A cultural tradition of knowledge—neoliberalism (free markets, self-governance)—shaped societal responses to COVID-19. Across 100+ countries, higher national neoliberalism predicted weaker and shorter government containment and lower individual compliance, revealing a cultural-evolutionary mismatch between market-oriented values and public-goods coordination.
      </p>
      <p class="citation">
        <strong>Liu, Y.*</strong>, Wu, Z.*, Wang, Y., Dong, Z., Sun, Z., & Gan, Y. (2024).
        Neoliberalism and governmental and individual responses to the COVID-19 Pandemic: A cross-national analysis.
        <em>Political Psychology</em>, 45(2), 363–382.
      </p>
      <p class="links">
        <a class="btn btn--light btn--sm" href="https://onlinelibrary.wiley.com/doi/full/10.1111/pops.12927">Journal</a>
        <a class="btn btn--primary btn--sm" href="/files/neoliberalism_covid.pdf">PDF</a>
      </p>
    </div>
  </div>

  <!-- 12) Cultural essentialism & appropriation -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_cultural_essentialism.png" alt="Cultural essentialism and exchange">
    </div>
    <div class="txt">
      <h4>Exclusive cultural “legacy”: Cultural essentialism increases derogation of shared-culture use</h4>
      <p>
        Across four studies in East Asian contexts (N=3,371), cultural essentialism—the belief that culture is inherent, stable, and exclusive—leads people to derogate outgroups who engage with shared cultural practices, via collective psychological ownership threat and especially when outgroups are culturally similar. These beliefs shape attitudes to cultural exchange, influencing the evolutionary dynamics of openness vs. closure.
      </p>
      <p class="citation">
        <strong>Liu, Y.</strong>, Sun, Z., Hu, Z., Wang, Y., Wang, Q., Hou, Y., & Hong, Y.-y. (submitted).
        Exclusive cultural “legacy”: Cultural essentialism increases derogation of outgroup’s use of shared culture.
      </p>
      <p class="links">
        <a class="btn btn--light btn--sm" href="https://doi.org/10.31234/osf.io/7bqxp_v1">Preprint</a>
      </p>
    </div>
  </div>

</details>

<!-- ===== Theme 3: How We Can Evolve Better ===== -->
<details class="theme">
  <summary><span class="chev">▶</span> How We Can Evolve Better</summary>

  <!-- 13) Depolarization via hybrid networks -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_LLM_depolarization.png" alt="Fact-sensitive AI in hybrid networks">
    </div>
    <div class="txt">
      <h4>Depolarization in human–AI hybrid networks through complex contagion</h4>
      <p>
        We are conducting a human–AI hybrid social network experiment to test whether fact-sensitive AI agents—embedded as trusted in-group partners—can promote belief updating and depolarization. Building on complex-contagion theory, the planned analyses examine how consistent, evidence-based reinforcement spreads across issues such as guns, climate, and immigration.
      </p>
      <p class="citation">
        <strong>Liu, Y.</strong>, Hu, X., Jackson, J., & Chen, Y. (data collecting).
        Depolarization in human–AI hybrid networks through complex contagion.
      </p>
      <p class="links">
        <span class="btn btn--light btn--sm">Available upon request</span>
      </p>
    </div>
  </div>

  <!-- 14) AI brokerage for socializing -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_broker_agent.png" alt="AI broker agent diagram">
    </div>
    <div class="txt">
      <h4>Can AI brokerage promote human connection in hybrid social networks?</h4>
      <p>
        We are testing whether AI agents can serve as brokers—building rapport, matching partners, and offering lightweight conversational scaffolding—to reduce undersociality and communication friction. The study examines whether this design can support more frequent and higher-quality human interactions without encouraging over-reliance on AI companionship.
      </p>
      <p class="citation">
        <strong>Liu, Y.</strong>, Hu, X., Jackson, J., & Chen, Y. (data collecting).
        AI brokerage and human connection in hybrid social networks.
      </p>
      <p class="links">
        <span class="btn btn--light btn--sm">Available upon request</span>
      </p>
    </div>
  </div>

  <!-- 15) SocAIty platform -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_LLMAgents.png" alt="SocAIty platform">
    </div>
    <div class="txt">
      <h4>SocAIty: A platform for studying social and cultural evolution in human–AI hybrid networks</h4>
      <p>
        We are developing a framework for human–AI hybrid networks across state, structure, and process layers, specifying AI roles as participants, brokers, moderators, or analysts. <em>SocAIty</em> is intended to support real-time, multi-stage network experiments on how AI integration may reshape communication, coordination, learning, and norm dynamics.
      </p>
      <p class="citation">
        Hu, X., <strong>Liu, Y.</strong>, Li, Y., Li, X., & Chen, Y. (preparing).
        SocAIty: A platform for studying social and cultural evolution in human–AI hybrid networks.
      </p>
      <p class="links">
        <span class="btn btn--light btn--sm">Available upon request</span>
      </p>
    </div>
  </div>

  <!-- 16) Deliberative democracy beliefs -->
  <div class="rcard">
    <div class="img">
      <img src="/images/Research_deliberative_democracy.png" alt="Deliberative democracy beliefs">
    </div>
    <div class="txt">
      <h4>Redefining (a good) democracy amid affective polarization</h4>
      <p>
        We show that citizens’ lay beliefs about deliberative democracy matter: across four studies in China (N=1,634), stronger endorsement predicts less outgroup derogation on public issues, with effects attenuated at high opinion extremity and partly mediated by receptiveness to opposing views. Shaping public beliefs offers a lever to improve group processes and inclusive democratic outcomes.
      </p>
      <p class="citation">
        <strong>Liu, Y.*</strong>, Wang, K.*, & Hou, Y. (R&amp;R).
        Redefining (a good) democracy amid the crisis of affective polarization: Lay beliefs of deliberative democracy can mitigate opponent derogation.
        <em>Personality and Social Psychology Bulletin</em>.
      </p>
      <p class="links">
        <a class="btn btn--light btn--sm" href="https://doi.org/10.31234/osf.io/gfdwx_v1">Preprint</a>
      </p>
    </div>
  </div>

</details>
