# Ficheiros e PDF

## Representação de campos de ficheiro

Um `FileField`/`ImageField` nunca é serializado como um caminho ou URL em bruto. O
`FileFieldsMixin` (parte do `BaseSerializer`) representa-o antes como um pequeno objeto:

```json
{
  "url": "https://.../media/....png?token=1699999999.abc123...",
  "name": "logo.png",
  "ext": "png",
  "kind": "image",
  "mime_type": "image/png",
  "size": 48213
}
```

`kind` é derivado da extensão do ficheiro (`image`, `pdf`, `video`, `audio`, ou `file` como
categoria genérica) — não do conteúdo real do ficheiro.

## URLs protegidos

Todo o URL de ficheiro transporta um parâmetro de query `?token=`, gerado pelo `FullPath`
(assinado com HMAC contra `FILE_TOKEN.KEY`) e validado pelo `FileAccessMiddleware` em qualquer
pedido sob `settings.MEDIA_URL` — ver
[Middleware](../architecture/middleware.md#fileaccessmiddleware-coremiddlewarefile_accesspy-ativo-por-omissão).
Sem um token válido, o acesso direto a um ficheiro enviado é rejeitado com um `401`.

Dois tipos de token:

- **Temporário** (o padrão para qualquer campo não listado em `permanent_fields_files` do
  serializer) — limitado no tempo, `FILE_TOKEN.TEMP_TTL` segundos (por omissão `300`), controlado
  por `FILE_TOKEN.ENABLE_TEMPORARY`.
- **Permanente** — para um nome de campo explicitamente listado em `permanent_fields_files` no
  serializer, controlado por `FILE_TOKEN.ENABLE_PERMANENT`.

```python
class DocumentSerializer(BaseSerializer):
    permanent_fields_files = ["attachment"]   # o URL deste campo nunca expira

    class Meta:
        model = Document
        fields = "__all__"
```

> [!NOTE]
> Se a definição `FILE_TOKEN.ENABLE_*` relevante estiver desligada, ou `FILE_TOKEN.KEY` não
> estiver configurada, `FullPath.url()` devolve `None` para esse campo em vez de um URL
> desprotegido — falha fechado, nunca recua para expor o ficheiro.

## Caminhos de upload

`file_path(instance, file_name, pasta="")` (`core/base/models.py`) é o auxiliar `upload_to` do
framework — gera um nome de ficheiro UUID (nunca o nome original, evitando colisões) sob
`{entity_type_id}/{entity_id}/{instance_id}/{pasta}/{filename}`, pelo que os uploads já ficam
organizados por tenant em disco:

```python
class Document(BaseModel):
    attachment = models.FileField(upload_to=file_path)
```

## PDF

`core/utils` fornece os blocos de construção para gerar PDFs e os códigos normalmente embutidos
neles, por cima do WeasyPrint:

- `PDF(template_path, request, doc=None, download=False, **context)` — renderiza um template
  Django (ou uma string HTML em bruto, se `template_path` não terminar em `.html`) para uma
  `HttpResponse` em PDF. `download=True` define `Content-Disposition: attachment`; caso contrário
  o PDF é servido inline.
- `make_qr_b64(text)` / `make_barcode_b64(value)` — código QR / código de barras Code128 como PNG
  codificado em base64, pronto a embutir diretamente num template HTML como
  `<img src="data:image/png;base64,...">`.
- `png_bytes_to_b64(png_bytes)` — o auxiliar partilhado de codificação em base64 usado pelas duas
  funções acima.

As actions de PDF já embutidas no `BaseAPIView` (exportação por registo e por lista, controladas
pelas permissões `pdf_<model>`/`pdf_list_<model>` — ver [O contrato Schema 1.0](../api/schema-contract.md))
são o que a maioria dos models usa por trás disto; uma aplicação só precisa de fornecer o seu
próprio template. O layout específico de cada aplicação pertence aos seus próprios templates —
reutilizar os utilitários acima em vez de duplicar a geração de QR/código de barras por app.
