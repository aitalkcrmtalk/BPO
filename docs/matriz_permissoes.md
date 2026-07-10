# Matriz de Permissões (FINAL)

Legenda: ✅ permitido · ❌ negado

## EMPRESAS

| Papel        | CREATE | READ | UPDATE | DELETE | Escopo   |
| ------------ | :----: | :--: | :----: | :----: | -------- |
| super_admin  |   ✅   |  ✅  |   ✅   |   ✅   | Todas    |
| admin        |   ❌   |  ✅  |   ❌   |   ❌   | Própria  |
| usuario      |   ❌   |  ✅  |   ❌   |   ❌   | Própria  |

## ASSINATURAS

| Papel        | CREATE | READ | UPDATE | DELETE | Escopo   |
| ------------ | :----: | :--: | :----: | :----: | -------- |
| super_admin  |   ✅   |  ✅  |   ✅   |   ✅   | Todas    |
| admin        |   ✅   |  ✅  |   ✅   |   ❌   | Própria  |
| usuario      |   ❌   |  ✅  |   ❌   |   ❌   | Própria  |

## CLIENTES

| Papel        | CREATE | READ | UPDATE | DELETE | Escopo      |
| ------------ | :----: | :--: | :----: | :----: | ----------- |
| super_admin  |   ✅   |  ✅  |   ✅   |   ✅   | Todas       |
| admin        |   ✅   |  ✅  |   ✅   |   ❌   | Própria     |
| usuario      |   ❌   |  ✅  |   ❌   |   ❌   | Atribuídos  |

## DOCUMENTOS

| Papel        | CREATE | READ | UPDATE | DELETE | Escopo      |
| ------------ | :----: | :--: | :----: | :----: | ----------- |
| super_admin  |   ✅   |  ✅  |   ✅   |   ✅   | Todas       |
| admin        |   ✅   |  ✅  |   ✅   |   ❌   | Própria     |
| usuario      |   ❌   |  ✅  |   ❌   |   ❌   | Atribuídos  |

## PERFIS (USUÁRIOS)

| Papel        | CREATE | READ | UPDATE | DELETE | Escopo   |
| ------------ | :----: | :--: | :----: | :----: | -------- |
| super_admin  |   ✅   |  ✅  |   ✅   |   ✅   | Todas    |
| admin        |   ✅   |  ✅  |   ✅   |   ❌   | Própria  |
| usuario      |   ❌   |  ✅  |   ✅*  |   ❌   | Próprio  |

\* `usuario` pode atualizar apenas seu próprio perfil.

## MODULOS

| Papel        | CREATE | READ | UPDATE | DELETE | Escopo |
| ------------ | :----: | :--: | :----: | :----: | ------ |
| super_admin  |   ✅   |  ✅  |   ✅   |   ✅   | Todas  |
| admin        |   ❌   |  ✅  |   ❌   |   ❌   | Todas  |
| usuario      |   ❌   |  ✅  |   ❌   |   ❌   | Todas  |