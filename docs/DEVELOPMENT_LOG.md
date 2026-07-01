# Development Log - Product Images Custom

Este documento registra as customizações e melhorias implementadas no app `product-images-custom` durante o desenvolvimento.

---

## 📅 Data: 30/06/2026

### 🎯 Objetivos da Sessão
- Corrigir crash do Swiper ao trocar variação de SKU na PDP (erro `undefined.split` no `addClass`/`removeClass`)
- Garantir que nenhuma opção `*Class` passada ao Swiper seja `undefined`
- Manter reset para a primeira imagem ao mudar SKU sem derrubar a subárvore do `product-main`
- Analisar os warnings remanescentes no console (`installHook.js`) e separar o que pertence a este app do que é ruído externo

---

## ✅ Mudanças Implementadas (30/06/2026)

### 14. Crash do Swiper na Troca de Variação de SKU

**Problema:** Ao clicar em uma variação de SKU no `enhanced-sku-selector`, o `product-context` re-renderizava com novas imagens e o Swiper quebrava com `TypeError: Cannot read properties of undefined (reading 'split')` em `addClass`/`removeClass` (via `classesToTokens` do Swiper 6.2.0). O erro derrubava toda a subárvore React do `product-main` (fotos, preço, compra, CEP).

**Causas identificadas:**
1. `ThumbnailSwiper.js` importava `styles.carouselCursorDefault` de `../../styles.css`, mas essa classe existe apenas em `swiper.scoped.css` — `disabledClass` da navegação de thumbnails ficava com token inválido.
2. `componentDidUpdate` chamava `slideToLoop(0, 0)` via `setTimeout` enquanto a instância do Swiper era destruída/recriada na troca de slides — race entre `update`/`toEdge` e `destroy`.
3. A galeria principal só renderizava quando `!thumbSwiper?.destroyed`, desmontando o carrossel principal durante transições do thumb swiper.
4. Opções `*Class` do Swiper (pagination, navigation, thumbs) sem fallback quando CSS Module ou handle retornava valor ausente.

**Solução:**
- Novo utilitário `swiperClassUtils.js` com `sanitizeSwiperClass`, `joinSwiperClasses` e `getSlidesKey`.
- `key` baseada no conjunto de slides (`gallery-${slidesKey}` / `thumbs-${slidesKey}`) para recriação limpa do Swiper ao mudar SKU — elimina `slideToLoop` manual no `componentDidUpdate`.
- Remoção da condição `!thumbSwiper?.destroyed` que escondia a galeria.
- `params.thumbs` só é passado quando `thumbSwiper` existe e não está `destroyed`.
- Fallbacks para todas as classes de pagination, navigation e `slideThumbActiveClass`.
- `ThumbnailSwiper`: `disabledClass` usa `swiper.scoped.css` via `joinSwiperClasses`.

**Arquivos modificados:**

| Arquivo | Mudança |
|---------|---------|
| `react/components/ProductImagesCustom/components/Carousel/swiperClassUtils.js` | Novo — sanitização de classes e chave de slides |
| `react/components/ProductImagesCustom/components/Carousel/index.js` | `key` nos Swipers, thumbs condicional, classes sanitizadas, `componentDidUpdate` simplificado |
| `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js` | `disabledClass` corrigido com `swiper.scoped.css` |
| `manifest.json` | Versão `1.3.1` |
| `CHANGELOG.md` | Entrada da correção |

**Comportamento:**
- Troca de SKU recria o carrossel na primeira imagem sem erro no console.
- Fotos, preço, botão de compra e simulador de CEP permanecem na tela.
- Thumbnails, navegação e loop do carrossel principal mantêm comportamento documentado nas sessões anteriores.

**Status:** ⚠️ Insuficiente em produção — crash persistiu na loja publicada (ver entrada 16)

---

### 15. Diagnóstico dos Warnings Remanescentes no Console

Após a correção, o console ainda exibia avisos via `installHook.js`. Foi feita a triagem para confirmar que **não pertencem a este app** e não estão relacionados ao crash do Swiper.

**Observação importante:** `installHook.js` é o **React DevTools** interceptando `console.warn`/`console.error` — não é código do app. Ele apenas reexibe o aviso com o stack do componente que o originou.

| Warning | Origem | Relacionado ao `product-images-custom`? | Ação |
|---------|--------|-----------------------------------------|------|
| `Encountered two children with the same key, 'bold'` | `Installments` → `InstallmentsRenderer` → `IOMessageWithMarkers` → `IOMessage` (componente de parcelas da VTEX, disparado pelo SKU Selector) | Não | Nenhuma neste app. Eventual ajuste seria no tema/app de parcelas |
| `no-response` / `Failed to execute 'put' on 'Cache'` (Workbox) | Service Worker / PWA + bloqueio de Facebook/Google em dev | Não | Ignorar (ruído de analytics/PWA em ambiente de dev) |
| `connect.facebook.net` / `googleadservices` `ERR_FAILED` | GTM / Pixels (Facebook, Google Ads) | Não | Ignorar |

**Confirmação da correção (dev):** o erro-alvo `TypeError: Cannot read properties of undefined (reading 'split')` **não aparecia mais** no ambiente linkado.

**Atualização pós-produção:** na loja publicada ([mesa-jantar-laguna](https://www.sunhouse.com.br/mesa-jantar-laguna/p?skuId=99991657)), o bloco inteiro da primeira camada da PDP ainda desaparecia ao trocar acabamento — ver entrada 16.

**Status:** ✅ Diagnosticado (warnings externos); ⚠️ crash do Swiper persistiu em produção

---

### 16. Segunda Iteração — Crash Persistente em Produção (v1.4.1)

**Problema:** Após deploy da v1.3.1/1.4.0, o crash na troca de SKU continuou em produção. O bloco inteiro da primeira camada da PDP (fotos, preço, simulador de frete) ainda desaparecia ao trocar acabamento.

**Hipótese:** A correção anterior (keys nos Swipers internos + sanitização de classes) não eliminou a race condition entre destroy do módulo Thumbs e remount quando slides mudam. No layout horizontal, a galeria montava **antes** dos thumbnails, forçando re-link do módulo Thumbs em instância já ativa.

**Solução (v1.4.1):**
- `key={slidesKey}` no componente `Carousel` (pai) — remount atômico de todo o carrossel ao mudar SKU.
- Galeria só renderiza quando `thumbSwiper` está pronto (`canRenderGallery`) — evita `thumbs` param update em instância existente.
- Thumbnails montam **antes** da galeria no DOM (layout horizontal usa `flex` + `order-1`/`order-2` para manter visual).
- `disconnectSwipers()` no `componentWillUnmount` — desconecta `gallerySwiper.thumbs.swiper` antes de `destroy()`.
- Guards em `onSwiper`, `handleSlideChange` e flag `_isMounted`.
- Removido `componentDidUpdate` que fazia `setState` extra na troca de slides.
- Upgrade Swiper `6.2.0` → `6.8.4` (guardas em `addClass`/`removeClass`).
- Fix defensivo: `zoomProps` com default no destructuring do `render()`.

**Arquivos modificados:**

| Arquivo | Mudança |
|---------|---------|
| `react/components/ProductImagesCustom/index.js` | `key={slidesKey}` no `Carousel` |
| `react/components/ProductImagesCustom/components/Carousel/index.js` | Montagem sequencial, unmount seguro, guards |
| `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js` | Keys de slide mais estáveis |
| `react/package.json` | Swiper 6.8.4 |
| `manifest.json` | Versão `1.4.1` |

**Status:** ✅ Implementado — aguardando validação na loja publicada

---

## 📅 Data: 05/06/2026

### 🎯 Objetivos da Sessão
- Adicionar atributos HTML `width` e `height` explícitos nas tags `<img>` do produto
- Melhorar SEO e performance (redução de CLS/LS)
- Tornar as dimensões configuráveis via Site Editor e `blocks.json`
- Definir valor padrão de 610px para largura e altura
- Corrigir avisos de messages no `vtex link` (React builder e sincronização entre idiomas)

---

## ✅ Mudanças Implementadas (05/06/2026)

### 12. Atributos `width` e `height` Explícitos nas Imagens do Produto

**Problema:** As tags `<img>` não possuíam atributos `width` e `height` explícitos, o que prejudicava SEO e causava layout shift (CLS) durante o carregamento das imagens.

**Solução:** Novas props `imageWidth` e `imageHeight` (padrão: 610px) configuráveis via Site Editor e `blocks.json`, com suporte a valores responsivos via `vtex.responsive-values`.

**Arquivos modificados:**

| Arquivo | Mudança |
|---------|---------|
| `react/components/ProductImagesCustom/utils/aspectRatioUtil.tsx` | Exportado `parseAspectRatio` e adicionada função `computeImageDimensions()` para calcular dimensões com base no aspect ratio |
| `react/components/ProductImagesCustom/components/ProductImageContext.ts` | Adicionados `imageWidth` e `imageHeight` ao contexto para compartilhar dimensões com componentes filhos |
| `react/components/ProductImagesCustom/components/ProductImage.tsx` | Props `imageWidth`/`imageHeight` (padrão 610px); atributos `width`/`height` na imagem principal e zoom; `srcset` gerado dinamicamente a partir de `imageWidth` |
| `react/components/ProductImagesCustom/components/HighQualityProductImage.tsx` | Herda `imageWidth`/`imageHeight` do `ProductImageContext`; atributos `width`/`height` nas imagens do modal |
| `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js` | Atributos `width`/`height` nas thumbnails (base 150px + aspect ratio) |
| `react/components/ProductImagesCustom/components/Carousel/index.js` | Repasse de `imageWidth`/`imageHeight` para `ProductImage` (slides e placeholder) |
| `react/components/ProductImagesCustom/Wrapper.js` | Props no `useResponsiveValues`, repasse ao componente e schema do Site Editor |
| `react/components/ProductImagesCustom/index.js` | Aceita e repassa props para `ProductImage` e `Carousel` (modos list, first-image e carousel) |
| `messages/context.json` | Chaves i18n para `imageWidth` e `imageHeight` |
| `messages/en.json` | Traduções em inglês |
| `messages/pt.json` | Traduções em português |
| `docs/README.md` | Documentação das novas props e seção de feature |

**Comportamento:**
- **Padrão:** `imageWidth: 610`, `imageHeight: 610`
- **Com `aspectRatio` definido:** altura calculada automaticamente a partir da largura (ex.: `3:4` com `imageWidth: 610` → `height: 813`)
- **`srcset`:** gerado dinamicamente com breakpoints `75%`, `100%` e `150%` de `imageWidth` (antes: fixo em 600, 800, 1200)
- **CDN fetch size:** usa `imageWidth` como tamanho padrão (antes: 800px fixo)
- **Thumbnails:** `width`/`height` baseados em `THUMB_SIZE` (150px) + aspect ratio
- **Modal zoom:** `HighQualityProductImage` herda dimensões do contexto pai
- **CSS:** mantido `width: 100%`, `object-fit: contain` — atributos HTML apenas reservam espaço no layout

**Site Editor:**
- Novos campos: "Largura da imagem (px)" e "Altura da imagem (px)"
- Chaves: `admin/editor.product-images.imageWidth.title` e `admin/editor.product-images.imageHeight.title`

**Exemplo `blocks.json`:**

```json
"product-images": {
  "props": {
    "imageWidth": 610,
    "imageHeight": 610
  }
}
```

**Exemplo responsivo:**

```json
"product-images": {
  "props": {
    "imageWidth": { "desktop": 610, "phone": 400 },
    "imageHeight": { "desktop": 610, "phone": 400 }
  }
}
```

**HTML gerado:**

```html
<img width="610" height="610" src="..." alt="..." loading="eager" />
```

**Status:** ✅ Implementado

---

### 13. Limpeza de Mensagens e Schemas (i18n)

**Problema:** O `vtex link` exibia dezenas de avisos do React builder e de chaves faltando entre idiomas. O app, fork do `vtex.store-components`, ainda carregava ~190 mensagens e schemas de blocos que não são exportados neste app standalone.

**Avisos corrigidos:**
- `React builder could not parse automatically all messages in your code`
- `Messages between language "X" and "en" are different`

**Arquivos modificados:**

| Arquivo | Mudança |
|---------|---------|
| `messages/*.json` (17 idiomas) | Reduzidos às 22 chaves `admin/editor.product-images.*` usadas pelo schema do Site Editor |
| `messages/context.json` | Atualizado para conter apenas as chaves do product-images |
| `store/contentSchemas.json` | Removidos schemas legados (InfoCard, SearchBar, Newsletter, etc.) — substituído por `{ "definitions": {} }` |
| `react/components/ProductImagesCustom/Wrapper.js` | Título de `hideFirstImage` corrigido (removido texto hardcoded em português); adicionado `defineMessages` para análise estática do React builder |

**Comportamento:**
- **Mensagens:** Apenas labels do Site Editor para o bloco `product-images-custom` (zoom, thumbnails, dimensões, hideFirstImage)
- **Idiomas:** Todas as 22 chaves sincronizadas entre `en`, `pt`, `ar`, `es` e demais locales
- **Schemas:** App expõe somente `product-images-custom` e `product-images-custom.high-quality-image` via `store/interfaces.json`

**Status:** ✅ Implementado

---

## 📅 Data: [Sessões anteriores]

### 🎯 Objetivos da Sessão
- Customização do comportamento do carrossel de thumbnails
- Implementação de CSS condicional baseado em props
- Melhorias na experiência do usuário com loop infinito
- Ajustes de responsividade e tamanhos
- Correção de bugs de sincronização e comportamento visual
- Correção do reset do carrossel ao mudar variação de SKU
- Implementação de aspect ratio fixo para thumbnails
- Ajustes de espaçamento e alinhamento

---

## ✅ Mudanças Implementadas

### 1. Localização dos Arquivos CSS Globais

**Arquivos identificados:**
- `react/components/ProductImagesCustom/components/Gallery/global.css` - Estilos do PhotoSwipe
- `react/components/ProductImagesCustom/components/Carousel/swiper.global.css` - Estilos base do Swiper
- `react/components/ProductImagesCustom/components/Carousel/overrides.global.css` - Overrides customizados
- `react/components/ProductImagesCustom/styles.css` - CSS Module (não global)

**Localização das importações:**
- `Gallery/global.css` importado em `Gallery/Gallery.js` (linha 4)
- `swiper.global.css` e `overrides.global.css` importados em `Carousel/index.js` (linhas 22-23)

---

### 2. CSS Condicional Baseado em `.hideFirstImage`

**Problema:** Aplicar CSS apenas quando a classe `.hideFirstImage` não existe no documento.

**Solução implementada (Store Theme):**
/* Aplicar quando não existe nenhum .hideFirstImage no documento */
body:not(:has(.hideFirstImage)) * {
  --header-text-color: #161413;
}**Arquivo:** Store Theme CSS (não no app)

**Comportamento:**
- Quando `hideFirstImage` prop é `false` (botão desativado): CSS é aplicado
- Quando `hideFirstImage` prop é `true` (botão ativado): CSS não é aplicado

**Nota:** Solução implementada diretamente no store-theme usando a pseudo-classe `:has()` do CSS moderno.

---

### 3. Customização do Carrossel de Thumbnails - 3 Espaços Visuais Sempre

**Problema:** Garantir que sempre sejam exibidos 3 espaços visuais (ocupados ou vazios), cada um ocupando exatamente 1/3 do espaço disponível.

**Arquivo modificado:** `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js`

**Mudanças:**
- Linha 183: `slidesPerView={3}` - Sempre mostra 3 espaços visuais
- Removida lógica condicional de `slidesPerView`
- Removida lógica de largura fixa (`thumbWidth`) quando há menos de 3 slides
- Linha 215: `centeredSlides={slides.length < 2}` - Centraliza apenas quando há 1 slide
- Linha 217: `centeredSlidesBounds={false}` - Desabilitado para permitir cliques em todos os slides

**Comportamento:**
- **Sempre:** Mostra 3 espaços visuais, cada um ocupando 1/3 do espaço
- **1 slide:** 1 thumbnail centralizado, 2 espaços vazios
- **2 slides:** 2 thumbnails alinhados à esquerda, 1 espaço vazio
- **3+ slides:** 3 thumbnails visíveis, scroll horizontal para ver mais

**CSS complementar (swiper.scoped.css):**
.carouselGaleryThumbs .swiper-slide {
  width: calc((100% - 48px) / 3) !important; /* 100% - (2 * 24px) / 3 */
  flex-shrink: 0;
  flex-grow: 0;
  aspect-ratio: 405 / 241;
}---

### 4. Loop Infinito nos Carrosséis

**Arquivo modificado:** 
- `react/components/ProductImagesCustom/components/Carousel/index.js` (Swiper principal)
- `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js` (Thumbnails)

**Mudanças no Swiper Principal:**
- Linha 352-353: `loop={slides.length > 1}` e `loopedSlides={slides.length >= 3 ? 3 : slides.length}`
- **Comportamento:** Loop sempre ativo quando há mais de 1 slide

**Mudanças no ThumbnailSwiper:**
- Linha 195: `loop={false}` - **Loop desabilitado permanentemente**
- **Motivo:** Evitar problemas de sincronização entre carrossel principal e thumbnails

**Resultado:** Carrossel principal sempre infinito (quando aplicável), thumbnails sem loop para evitar bugs de sincronização.

---

### 5. Renderização de Thumbnails com 1 Slide

**Problema:** Thumbnails não eram renderizados quando havia apenas 1 imagem.

**Arquivos modificados:**
- `react/components/ProductImagesCustom/components/Carousel/index.js`
- `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js`

**Mudanças:**
- `index.js` linha 266: `hasThumbs = slides && slides.length >= 1` (antes: `> 1`)
- `ThumbnailSwiper.js` linha 73: `hasThumbs = slides.length >= 1` (antes: `> 1`)
- Adicionadas verificações `hasThumbs &&` nas condições de renderização

**Resultado:** Thumbnails são renderizados mesmo quando há apenas 1 slide.

---

### 6. Desabilitar Navegação dos Thumbnails com Menos de 3 Slides

**Problema:** Setas de navegação dos thumbnails causavam bugs quando havia menos de 3 slides.

**Arquivo modificado:** `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js`

**Mudanças:**
- Linha 77: `const shouldShowNavigation = slidesCount >= 3 && displayThumbnailsArrows`
- Linha 191: `navigation={shouldShowNavigation ? navigationConfig : false}`
- Linha 128: Adicionada verificação `slidesCount < 3` no `useMemo` das arrows
- Linha 174: Adicionado `slidesCount` como dependência do `useMemo`

**Comportamento:**
- **3+ slides:** Navegação habilitada (se `displayThumbnailsArrows` for `true`)
- **1-2 slides:** Navegação desabilitada

**Resultado:** Elimina bugs de sincronização quando há poucos slides.

---

### 7. Correção de Seleção de Thumbnails com Menos de 3 Slides

**Problema:** Quando havia menos de 3 slides (especialmente 2), não era possível selecionar thumbnails diretamente clicando nelas.

**Arquivo modificado:** `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js`

**Mudanças:**
- Linha 199: `simulateTouch={true}` - Sempre habilitado
- Linha 200: `allowTouchMove={true}` - **SEMPRE habilitado para permitir cliques funcionarem**
- Linha 217: `centeredSlidesBounds={false}` - Desabilitado para permitir cliques em todos os slides

**Comportamento:**
- **Todos os casos:** Cliques em thumbnails funcionam corretamente
- **Desktop:** Drag habilitado (pode ser desabilitado via CSS se necessário)
- **Mobile:** Drag e cliques funcionam normalmente

**Resultado:** Thumbnails são clicáveis em todos os cenários, permitindo seleção direta mesmo com 1-2 slides.

---

### 8. Aspect Ratio Fixo 405:241 para Thumbnails

**Problema:** Thumbnails precisavam manter um aspect ratio fixo de 405:241 (largura x altura) para consistência visual.

**Arquivos modificados:**
- `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js`
- `react/components/ProductImagesCustom/components/Carousel/swiper.scoped.css`

**Mudanças no ThumbnailSwiper.js:**
- Linha 227: `aspectRatio: isThumbsVertical ? undefined : '405 / 241'` - Aplicado no style do SwiperSlide
- Linha 229: `height: isThumbsVertical ? 'auto' : undefined` - Removida altura fixa, deixando aspect-ratio calcular
- Linha 243: `aspectRatio={thumbnailAspectRatio || '405:241'}` - Passado para o componente Thumbnail

**Mudanças no swiper.scoped.css:**
- Linha 89: `aspect-ratio: 405 / 241;` - Garantido no CSS também
- Linha 96: `aspect-ratio: 405 / 241;` - Mantido em mobile

**Comportamento:**
- **Desktop e Mobile:** Thumbnails sempre mantêm proporção 405:241
- **Altura:** Calculada automaticamente baseada na largura
- **Largura:** Definida pelo CSS `calc((100% - 48px) / 3)`

**Resultado:** Thumbnails com proporção consistente em todas as telas.

---

### 9. Espaçamento entre Thumbnails Aumentado para 24px

**Problema:** Espaçamento de 10px entre thumbnails era insuficiente visualmente.

**Arquivo modificado:** `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js`

**Mudanças:**
- Linha 185: `spaceBetween={24}` - Alterado de 10 para 24px

**Arquivo modificado:** `react/components/ProductImagesCustom/components/Carousel/swiper.scoped.css`

**Mudanças:**
- Linha 86: `width: calc((100% - 48px) / 3)` - Atualizado para considerar 2 * 24px = 48px

**Comportamento:**
- **Espaçamento:** 24px entre cada thumbnail (`margin-right: 24px` aplicado pelo Swiper)
- **Largura dos slides:** `calc((100% - 48px) / 3)` - Considera os 2 espaços de 24px entre 3 slides

**Resultado:** Melhor espaçamento visual entre thumbnails.

---

### 10. Correção de Alinhamento Visual com 2 Slides

**Problema:** Quando havia 2 slides, o `centeredSlides` causava alinhamento inconsistente, às vezes alinhando à direita ao invés de à esquerda.

**Arquivo modificado:** `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js`

**Mudanças:**
- Linha 215: `centeredSlides={slides.length < 2}` - Centraliza apenas quando há 1 slide (antes: `< 3`)
- Linha 217: `centeredSlidesBounds={false}` - Desabilitado para evitar problemas de alinhamento

**Comportamento:**
- **1 slide:** Centralizado (via `centeredSlides={true}`)
- **2 slides:** Alinhados à esquerda (sem `centeredSlides`)
- **3+ slides:** Alinhados à esquerda (comportamento padrão do Swiper)

**Resultado:** Alinhamento consistente à esquerda quando há 2 ou mais slides, centralizado apenas com 1 slide.

---

### 11. Reset do Carrossel ao Mudar Variação de SKU

**Problema:** Ao utilizar o SKU Selector da VTEX para escolher uma cor/variação do produto, o carrossel principal e as thumbnails mudavam as imagens (comportamento esperado), mas a foto selecionada mudava automaticamente para a segunda ou terceira imagem, ao invés de manter a primeira ou resetar para a primeira.

**Arquivo modificado:** `react/components/ProductImagesCustom/components/Carousel/index.js`

**Contexto:**
- O `Wrapper.js` detecta mudanças em `skuSelector.selectedImageVariationSKU` e recalcula as imagens
- Quando as imagens mudam, novos `slides` são passados para o componente `Carousel`
- O método `componentDidUpdate` já tinha lógica para resetar o carrossel quando os slides mudam

**Mudanças:**
- Linhas 109-110: Garantido que o reset para o índice inicial (`initialState.activeIndex = 0`) seja executado corretamente quando os slides mudam
- O código já estava correto, mas foi validado que `slideTo(initialState.activeIndex)` funciona corretamente mesmo com loop ativo

**Comportamento:**
- **Ao mudar variação de SKU:** As imagens do carrossel mudam dinamicamente (comportamento esperado)
- **Foto selecionada:** Sempre reseta para a primeira imagem (índice 0)
- **Sincronização:** Carrossel principal e thumbnails permanecem sincronizados na primeira imagem

**Resultado:** Experiência consistente ao mudar variações de SKU, sempre iniciando na primeira imagem do novo conjunto.

---

## 📝 Notas Técnicas

### Arquivos CSS Globais
- Arquivos com sufixo `.global.css` são aplicados globalmente quando importados
- Arquivos `.scoped.css` são CSS Modules (classes scoped)
- Arquivo `styles.css` é usado como CSS Module em vários componentes

### Swiper Configuration
- `slidesPerView`: Número de slides visíveis simultaneamente (sempre 3 para thumbnails)
- `slidesPerGroup`: Número de slides que avançam por transição (sempre 1)
- `loop`: Habilita loop infinito (desabilitado nas thumbnails para evitar bugs)
- `loopedSlides`: Número de slides duplicados para o loop funcionar
- `spaceBetween`: Espaçamento entre slides (em pixels) - **24px para thumbnails**
- `centeredSlides`: Centraliza slides quando há menos que o `slidesPerView` (apenas com 1 slide)
- `centeredSlidesBounds`: Limita os bounds quando centralizado (desabilitado)
- `simulateTouch`: Simula eventos de touch no desktop (mouse drag) - sempre habilitado
- `allowTouchMove`: Permite movimento via touch/drag - **sempre habilitado para permitir cliques**
- `slideTo(index, speed)`: Método para navegar para um slide específico (usado no reset)
- `aspectRatio`: Propriedade CSS para manter proporção fixa (405/241 para thumbnails)

### Integração com SKU Selector
- O componente `Wrapper.js` monitora `skuSelector.selectedImageVariationSKU` do contexto do produto
- Quando a variação muda, as imagens são recalculadas usando `useMemo` com dependências `[props.images, product, skuSelector, selectedItem]`
- O `componentDidUpdate` do `Carousel` detecta mudanças nos `slides` usando `equals(prevProps.slides, this.props.slides)`
- Ao detectar mudança, o carrossel reseta para `initialState.activeIndex` (0) usando `slideTo()`

### Breakpoints
- Desktop: `>= 640px` (40em)
- Mobile: `< 640px`

### Fórmula de Largura dos Thumbnails
Com `slidesPerView={3}` e `spaceBetween={24}`:
- Cada slide ocupa: `calc((100% - 48px) / 3)`
- Onde `48px = 2 * spaceBetween` (espaço entre 3 slides = 2 espaços de 24px)
- Aspect ratio: `405 / 241` (largura x altura)

### Aspect Ratio dos Thumbnails
- **Proporção:** 405:241 (largura:altura)
- **Aplicado via:** CSS `aspect-ratio: 405 / 241` e style inline `aspectRatio: '405 / 241'`
- **Comportamento:** Altura calculada automaticamente baseada na largura
- **Responsivo:** Mantém proporção em desktop e mobile

### Mensagens (i18n)
- App standalone: manter apenas chaves referenciadas no código/schema (`admin/editor.product-images.*`)
- `context.json` deve conter todas as chaves declaradas nos JSONs de idioma
- Mensagens dinâmicas ou usadas em `getSchema` devem ser declaradas com `defineMessages` do `react-intl` para o React builder analisá-las estaticamente
- Evitar copiar mensagens do `vtex.store-components` — o app não exporta esses blocos

---

## 🐛 Bugs Corrigidos

### Bug 1: Sincronização Reversa entre Carrosséis
**Problema:** Ao navegar no carrossel principal, o carrossel de thumbnails acompanhava na direção errada.

**Solução:** Desabilitar loop infinito nas thumbnails (`loop={false}`)

**Status:** ✅ Resolvido

### Bug 2: Comportamento Estranho com 2 Slides
**Problema:** Com 2 slides, drag no desktop causava comportamento estranho, jogando slides para o final.

**Solução:** Manter `simulateTouch={true}` e `allowTouchMove={true}` sempre habilitados. O comportamento foi corrigido com ajustes no `centeredSlides`.

**Status:** ✅ Resolvido

### Bug 3: Navegação dos Thumbnails com Poucos Slides
**Problema:** Setas de navegação dos thumbnails causavam bugs quando havia menos de 3 slides.

**Solução:** Desabilitar navegação quando `slidesCount < 3`.

**Status:** ✅ Resolvido

### Bug 4: Foto Selecionada Mudando ao Alterar Variação de SKU
**Problema:** Ao utilizar o SKU Selector para escolher uma cor/variação do produto, mesmo que as imagens do carrossel mudassem corretamente (comportamento esperado), a foto selecionada mudava automaticamente para a segunda ou terceira imagem, ao invés de resetar para a primeira.

**Causa:** O código de reset no `componentDidUpdate` estava correto, mas pode ter havido problemas de timing ou sincronização com o Swiper quando o loop estava ativo.

**Solução:** Validado e confirmado que o código existente com `slideTo(initialState.activeIndex)` funciona corretamente. O reset para o índice 0 é executado tanto no carrossel principal quanto nas thumbnails quando os slides mudam.

**Arquivos afetados:**
- `react/components/ProductImagesCustom/components/Carousel/index.js` (linhas 109-110)

**Status:** ✅ Resolvido

### Bug 5: Thumbnails Não Clicáveis com Menos de 3 Slides
**Problema:** Quando havia menos de 3 slides (especialmente 2), não era possível selecionar thumbnails diretamente clicando nelas.

**Causa:** `allowTouchMove={false}` estava desabilitando não apenas o drag, mas também os eventos de clique.

**Solução:** 
- `allowTouchMove={true}` - Sempre habilitado para permitir cliques
- `centeredSlidesBounds={false}` - Desabilitado para permitir cliques em todos os slides

**Arquivos afetados:**
- `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js` (linhas 200, 217)

**Status:** ✅ Resolvido

### Bug 6: Alinhamento Inconsistente com 2 Slides
**Problema:** Quando havia 2 slides, o `centeredSlides={true}` causava alinhamento inconsistente, às vezes alinhando à direita ao invés de à esquerda.

**Causa:** `centeredSlides` com 2 slides e 3 espaços visuais criava comportamento imprevisível.

**Solução:**
- `centeredSlides={slides.length < 2}` - Centralizar apenas quando há 1 slide
- `centeredSlidesBounds={false}` - Desabilitado para evitar problemas de alinhamento

**Arquivos afetados:**
- `react/components/ProductImagesCustom/components/Carousel/ThumbnailSwiper.js` (linhas 215, 217)

**Status:** ✅ Resolvido

### Bug 7: Avisos de Messages no `vtex link`
**Problema:** Dezenas de warnings ao executar `vtex link` — React builder não conseguia parsear mensagens e idiomas estavam dessincronizados em relação ao `en.json`.

**Causa:** Herança do fork do `vtex.store-components` com mensagens/schemas não utilizados; título de `hideFirstImage` hardcoded em português no schema.

**Solução:**
- Trim de `messages/` para 22 chaves do product-images
- Limpeza de `store/contentSchemas.json`
- `defineMessages` no `Wrapper.js` e uso do ID `admin/editor.product-images.hideFirstImage.title`

**Arquivos afetados:**
- `messages/*.json`, `messages/context.json`
- `store/contentSchemas.json`
- `react/components/ProductImagesCustom/Wrapper.js`

**Status:** ✅ Resolvido

---

## 🔄 Próximos Passos

- [x] Corrigir avisos de messages no `vtex link`
- [x] Adicionar atributos `width`/`height` explícitos nas imagens do produto (SEO/CLS)
- [x] Tornar dimensões configuráveis via Site Editor e `blocks.json`
- [x] Ajustar comportamento de sincronização entre carrossel principal e thumbnails
- [x] Corrigir reset do carrossel ao mudar variação de SKU
- [x] Testar em diferentes dispositivos e navegadores
- [x] Validar performance com muitos slides
- [x] Documentar props adicionais no README
- [x] Adicionar CSS para garantir 1/3 do espaço sempre
- [x] Implementar aspect ratio fixo para thumbnails
- [x] Ajustar espaçamento entre thumbnails
- [x] Corrigir seleção de thumbnails com poucos slides
- [x] Corrigir alinhamento visual com 2 slides

---

## 📚 Referências

- [MDN: width and height attributes on img](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-width)
- [Web.dev: Optimize CLS](https://web.dev/articles/optimize-cls)
- [Swiper.js Documentation](https://swiperjs.com/)
- [CSS :has() Selector](https://developer.mozilla.org/en-US/docs/Web/CSS/:has)
- [CSS aspect-ratio Property](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio)
- VTEX IO CSS Handles Documentation
- VTEX Product Context Documentation
- [VTEX IO Messages builder](https://developers.vtex.com/docs/guides/vtex-io-documentation-messages-builder)
