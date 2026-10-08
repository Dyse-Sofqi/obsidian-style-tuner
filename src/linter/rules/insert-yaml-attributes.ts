import {Options, RuleType} from '../rules';
import RuleBuilder, {ExampleBuilder, OptionBuilderBase, YamlAttributeOptionBuilder} from './rule-builder';
import dedent from 'ts-dedent';
import {formatYAML, initYAML, loadYAML} from '../utils/yaml';
import {escapeDollarSigns, yamlRegex} from '../utils/regex';
import {
  defaultYamlAttributes,
  normalizeYamlAttributeEntries,
  renderYamlAttributeLine,
  type YamlAttributeEntry,
} from '../utils/yaml-attributes';

class InsertYamlAttributesOptions implements Options {
  textToInsert: YamlAttributeEntry[] = defaultYamlAttributes();
}

@RuleBuilder.register
export default class InsertYamlAttributes extends RuleBuilder<InsertYamlAttributesOptions> {
  constructor() {
    super({
      nameKey: 'rules.insert-yaml-attributes.name',
      descriptionKey: 'rules.insert-yaml-attributes.description',
      type: RuleType.YAML,
    });
  }
  get OptionsClass(): new () => InsertYamlAttributesOptions {
    return InsertYamlAttributesOptions;
  }
  apply(text: string, options: InsertYamlAttributesOptions): string {
    text = initYAML(text);
    return formatYAML(text, (text) => {
      const entries = normalizeYamlAttributeEntries(options.textToInsert);
      const parsedYaml = loadYAML(text.match(yamlRegex)[1]);
      const now = new Date();

      // 倒着插入：每条都塞到开头的 `---` 之后，反过来走最后顺序才与列表一致。
      // 这里必须先复制再反转——`.reverse()` 是就地反转，会直接改坏 settings 里
      // 那份数组（每次 lint 都把顺序翻一遍，界面上的排序也跟着跳）。
      for (const entry of [...entries].reverse()) {
        if (Object.prototype.hasOwnProperty.call(parsedYaml, entry.key)) {
          continue;
        }

        text = text.replace(/^---\n/, escapeDollarSigns(`---\n${renderYamlAttributeLine(entry, now)}\n`));
      }

      return text;
    });
  }
  get exampleBuilders(): ExampleBuilder<InsertYamlAttributesOptions>[] {
    return [
      new ExampleBuilder({
        description: 'Insert static lines into YAML frontmatter. Keys to insert: `aliases` (text), `tags` (text, value `doc`), `animal` (text, value `dog`)',
        before: dedent`
          ---
          animal: cat
          ---
        `,
        after: dedent`
          ---
          aliases:
          tags: doc
          animal: cat
          ---
        `,
        options: {
          textToInsert: [
            {key: 'aliases', type: 'text', value: ''},
            {key: 'tags', type: 'text', value: 'doc'},
            {key: 'animal', type: 'text', value: 'dog'},
          ],
        },
      }),
      new ExampleBuilder({
        description: 'A list key expands to a block sequence instead of a bare key',
        before: dedent`
          ---
          title: note
          ---
        `,
        after: dedent`
          ---
          tags:
            - a
            - b
          title: note
          ---
        `,
        options: {
          textToInsert: [
            {key: 'tags', type: 'list', value: 'a, b'},
          ],
        },
      }),
    ];
  }
  get optionBuilders(): OptionBuilderBase<InsertYamlAttributesOptions>[] {
    return [
      new YamlAttributeOptionBuilder({
        OptionsClass: InsertYamlAttributesOptions,
        nameKey: 'rules.insert-yaml-attributes.text-to-insert.name',
        descriptionKey: 'rules.insert-yaml-attributes.text-to-insert.description',
        emptyStateKey: 'rules.insert-yaml-attributes.text-to-insert.empty-state',
        optionsKey: 'textToInsert',
      }),
    ];
  }
}
