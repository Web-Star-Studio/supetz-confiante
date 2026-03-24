

## Plano: Seletor de Racas de Cachorro com Busca

### O que sera feito

Substituir o campo de texto livre "Raca" no formulario de cadastro de pet por um **dropdown com busca** (combobox) contendo todas as principais racas de cachorro encontradas no Brasil, em portugues. Incluir tambem a opcao "SRD (Sem Raca Definida)" e "Outra" para flexibilidade.

### Lista de racas (75+ racas)

Baseado em pesquisa do Patas da Casa e fontes brasileiras:

Akita, Akita Americano, American Bully, American Staffordshire Terrier, Basenji, Basset Hound, Beagle, Bichon Frise, Boerboel, Boiadeiro Australiano, Boiadeiro de Berna, Border Collie, Borzoi, Boston Terrier, Boxer, Bulldog Frances, Bulldog Ingles, Bull Terrier, Cane Corso, Cao de Crista Chines, Cavalier King Charles Spaniel, Chihuahua, Chow Chow, Cocker Spaniel, Collie, Dachshund, Dalmata, Doberman, Dogo Argentino, Dogue Alemao, Dogue de Bordeaux, Fila Brasileiro, Fox Terrier, Galgo Ingles, Golden Retriever, Husky Siberiano, Jack Russell Terrier, Kangal, Komondor, Labrador, Lhasa Apso, Lulu da Pomerania, Malamute do Alasca, Maltes, Mastiff Ingles, Mastim Napolitano, Mastim Tibetano, Pastor Alemao, Pastor Australiano, Pastor Belga, Pastor de Shetland, Pequines, Pinscher, Pitbull, Poodle, Pug, Rottweiler, Samoieda, Sao Bernardo, Schnauzer, Setter Irlandes, Shar Pei, Shiba Inu, Shih Tzu, Staffordshire Bull Terrier, Terra Nova, Terrier Brasileiro, Weimaraner, West Highland White Terrier, Whippet, Yorkshire, SRD (Sem Raca Definida), Outra

### Alteracoes

**Novo arquivo: `src/data/dogBreeds.ts`**
- Exportar array `DOG_BREEDS` com todas as racas ordenadas alfabeticamente
- Inclui "SRD (Sem Raca Definida)" no topo da lista

**Arquivo: `src/components/profile/PetProfileTab.tsx`**
- Importar `DOG_BREEDS` e componentes Popover + Command do shadcn
- Substituir o `<input>` de raca por um **Combobox** (Popover + Command) com:
  - Campo de busca para filtrar racas pelo nome
  - Lista scrollavel com todas as racas
  - Opcao "Outra" no final que permite digitar manualmente
- Manter compatibilidade: se o pet ja tem uma raca salva que nao esta na lista, exibir normalmente
- Estado `breedSearch` para filtrar a lista em tempo real
- Estado `showCustomBreed` para quando usuario seleciona "Outra"

### Detalhes tecnicos

- Usa componentes ja existentes: `Popover`, `PopoverTrigger`, `PopoverContent` de `@/components/ui/popover` e `Command` de `@/components/ui/command`
- Nenhuma alteracao no banco de dados (campo `breed` continua sendo `text`)
- Estilo consistente com o design atual (rounded-full, bg-supet-bg)

