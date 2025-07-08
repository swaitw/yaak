/* eslint-disable */
import { Color } from '@yaakapp-internal/plugins';
import classNames from 'classnames';
import type { GraphQLField, GraphQLInputField, GraphQLSchema, GraphQLType } from 'graphql';
import {
  getNamedType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isScalarType,
  isUnionType,
} from 'graphql';
import { CSSProperties, memo, ReactNode, useState } from 'react';
import { showGraphQLDocExplorerAtom } from '../atoms/graphqlSchemaAtom';
import { jotaiStore } from '../lib/jotai';
import { CountBadge } from './core/CountBadge';
import { Icon } from './core/Icon';
import { IconButton } from './core/IconButton';
import { Markdown } from './Markdown';

interface Props {
  style?: CSSProperties;
  schema: GraphQLSchema;
  className?: string;
}

type ExplorerItem =
  | { kind: 'type'; type: GraphQLType; from: ExplorerItem }
  | { kind: 'field'; type: GraphQLField<any, any>; from: ExplorerItem }
  | { kind: 'input_field'; type: GraphQLInputField; from: ExplorerItem }
  | null;

export const GraphQLDocsExplorer = memo(function ({ style, schema, className }: Props) {
  const [activeItem, setActiveItem] = useState<ExplorerItem>(null);

  const qryType = schema.getQueryType();
  const mutType = schema.getMutationType();
  const subType = schema.getSubscriptionType();

  const qryItem: ExplorerItem = qryType ? { kind: 'type', type: qryType, from: null } : null;
  const mutItem: ExplorerItem = mutType ? { kind: 'type', type: mutType, from: null } : null;
  const subItem: ExplorerItem = subType ? { kind: 'type', type: subType, from: null } : null;
  const allTypes = schema.getTypeMap();

  return (
    <div className={classNames(className, 'py-3 mx-3')} style={style}>
      <div className="h-full border border-dashed border-border rounded-lg">
        <GraphQLExplorerHeader item={activeItem} setItem={setActiveItem} />
        {activeItem == null ? (
          <div className="flex flex-col gap-3 overflow-y-auto h-full w-full p-3">
            <Heading>Root Types</Heading>
            <GqlTypeRow
              name={{ value: 'query', color: 'primary' }}
              item={qryItem}
              setItem={setActiveItem}
              className="!my-0"
            />
            <GqlTypeRow
              name={{ value: 'mutation', color: 'primary' }}
              item={mutItem}
              setItem={setActiveItem}
              className="!my-0"
            />
            <GqlTypeRow
              name={{ value: 'subscription', color: 'primary' }}
              item={subItem}
              setItem={setActiveItem}
              className="!my-0"
            />
            <Subheading count={Object.keys(allTypes).length}>All Schema Types</Subheading>
            <DocMarkdown>{schema.description ?? null}</DocMarkdown>
            <div className="flex flex-col gap-1">
              {Object.keys(allTypes).map((typeName) => {
                const t = allTypes[typeName]!;
                return (
                  <GqlTypeLink
                    key={t.name}
                    color="notice"
                    item={{ kind: 'type', type: t, from: null }}
                    setItem={setActiveItem}
                  />
                );
              })}
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto h-full w-full px-3 grid grid-cols-[minmax(0,1fr)]">
            <GqlTypeInfo item={activeItem} setItem={setActiveItem} schema={schema} />
          </div>
        )}
      </div>
    </div>
  );
});

function GraphQLExplorerHeader({
  item,
  setItem,
}: {
  item: ExplorerItem;
  setItem: (t: ExplorerItem) => void;
}) {
  return (
    <nav className="pl-2 pr-1 h-md grid grid-rows-1 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 overflow-x-auto min-w-0 hide-scrollbars">
      <div className="w-full">
        {item == null ? (
          <div className="flex items-center gap-2">
            <Icon icon="house" color="secondary" />
            <div className="text-text-subtle whitespace-nowrap _truncate">Schema Documentation</div>
          </div>
        ) : (
          <GqlTypeLink
            item={item.from}
            setItem={setItem}
            className="text-text-subtle !font-sans !text-base"
            leftSlot={<Icon icon="chevron_left" color="secondary" />}
          />
        )}
      </div>
      <IconButton
        icon="x"
        size="sm"
        className="text-text-subtle"
        title="Close documenation explorer"
        onClick={() => {
          jotaiStore.set(showGraphQLDocExplorerAtom, false);
        }}
      />
    </nav>
  );
}

function GqlTypeInfo({
  item,
  setItem,
  schema,
}: {
  item: ExplorerItem | null;
  setItem: (t: ExplorerItem) => void;
  schema: GraphQLSchema;
}) {
  if (item == null) return null;

  const name = item.kind === 'type' ? getNamedType(item.type).name : item.type.name;
  const description =
    item.kind === 'type' ? getNamedType(item.type).description : item.type.description;

  const heading = (
    <div className="mb-3">
      <Heading>{name}</Heading>
      <DocMarkdown>{description || 'No description'}</DocMarkdown>
    </div>
  );

  if (isScalarType(item.type)) {
    return heading;
  } else if (isNonNullType(item.type) || isListType(item.type)) {
    // kinda a hack, but we'll just unwrap there and show the named type
    return (
      <GqlTypeInfo
        item={{ ...item, kind: 'type', type: item.type.ofType }}
        setItem={setItem}
        schema={schema}
      />
    );
  } else if (isInterfaceType(item.type)) {
    const fields = item.type.getFields();
    const possibleTypes = schema.getPossibleTypes(item.type) ?? [];

    return (
      <div>
        {heading}

        <Subheading count={Object.keys(fields).length}>Fields</Subheading>
        {Object.keys(fields).map((fieldName) => {
          const field = fields[fieldName]!;
          const fieldItem: ExplorerItem = { kind: 'field', type: field, from: item };
          return (
            <div key={`${field.type}::${field.name}`} className="my-4">
              <GqlTypeRow
                item={fieldItem}
                setItem={setItem}
                name={{ value: fieldName, color: 'primary' }}
              />
            </div>
          );
        })}

        {possibleTypes.length > 0 && (
          <>
            <Subheading>Implemented By</Subheading>
            {possibleTypes.map((t: any) => (
              <GqlTypeRow
                key={t.name}
                item={{ kind: 'type', type: t, from: item }}
                setItem={setItem}
              />
            ))}
          </>
        )}
      </div>
    );
  } else if (isUnionType(item.type)) {
    const types = item.type.getTypes();

    return (
      <div>
        {heading}

        <Subheading>Possible Types</Subheading>
        {types.map((t) => (
          <GqlTypeRow key={t.name} item={{ kind: 'type', type: t, from: item }} setItem={setItem} />
        ))}
      </div>
    );
  } else if (isEnumType(item.type)) {
    const values = item.type.getValues();

    return (
      <div>
        {heading}
        <Subheading>Values</Subheading>
        {values.map((v) => (
          <div key={v.name} className="my-4 font-mono text-editor _truncate">
            <span className="text-primary">{v.value}</span>
            <DocMarkdown>{v.description ?? null}</DocMarkdown>
          </div>
        ))}
      </div>
    );
  } else if (item.kind === 'field') {
    return (
      <div className="flex flex-col gap-3">
        {heading}

        <div>
          <Subheading>Type</Subheading>
          <GqlTypeRow
            className="mt-4"
            item={{ kind: 'type', type: item.type.type, from: item }}
            setItem={setItem}
          />
        </div>

        {item.type.args.length > 0 && (
          <div>
            <Subheading>Arguments</Subheading>
            {item.type.args.map((a) => (
              <div key={a.type + '::' + a.name} className="my-4">
                <GqlTypeRow
                  name={{ value: a.name, color: 'info' }}
                  item={{ kind: 'input_field', type: a, from: item }}
                  setItem={setItem}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  } else if (item.kind === 'input_field' && isInputObjectType(item.type)) {
    const fields = item.type.getFields();
    return (
      <div>
        {heading}

        <Subheading count={Object.keys(fields).length}>Fields</Subheading>
        {Object.keys(fields).map((fieldName) => {
          const field = fields[fieldName];
          if (field == null) return null;
          const fieldItem: ExplorerItem = {
            kind: 'input_field',
            type: field,
            from: item,
          };
          return (
            <div key={`${field.type}::${field.name}`} className="my-4">
              <GqlTypeRow
                item={fieldItem}
                setItem={setItem}
                name={{ value: fieldName, color: 'primary' }}
              />
            </div>
          );
        })}
      </div>
    );
  } else if (item.kind === 'type' && isInputObjectType(item.type)) {
    const fields = item.type.getFields();
    return (
      <div>
        {heading}

        <Subheading count={Object.keys(fields).length}>Fields</Subheading>
        {Object.keys(fields).map((fieldName) => {
          const field = fields[fieldName];
          if (field == null) return null;
          const fieldItem: ExplorerItem = {
            kind: 'input_field',
            type: field,
            from: item,
          };
          return (
            <div key={`${field.type}::${field.name}`} className="my-4">
              <GqlTypeRow
                item={fieldItem}
                setItem={setItem}
                name={{ value: fieldName, color: 'primary' }}
              />
            </div>
          );
        })}
      </div>
    );
  } else if (item.kind === 'type' && isObjectType(item.type)) {
    const fields = item.type.getFields();
    const interfaces = item.type.getInterfaces();

    return (
      <div>
        {heading}
        {interfaces.length > 0 && (
          <>
            <Subheading>Implements</Subheading>
            {interfaces.map((i) => (
              <GqlTypeRow
                key={i.name}
                item={{ kind: 'type', type: i, from: item }}
                setItem={setItem}
              />
            ))}
          </>
        )}

        <Subheading count={Object.keys(fields).length}>Fields</Subheading>
        {Object.keys(fields).map((fieldName) => {
          const field = fields[fieldName];
          if (field == null) return null;
          const fieldItem: ExplorerItem = { kind: 'field', type: field, from: item };
          return (
            <div key={`${field.type}::${field.name}`} className="my-4">
              <GqlTypeRow
                item={fieldItem}
                setItem={setItem}
                name={{ value: fieldName, color: 'primary' }}
              />
            </div>
          );
        })}
      </div>
    );
  }

  console.log('Unknown GraphQL Type', item);
  return <div>Unknown GraphQL type</div>;
}

function GqlTypeRow({
  item,
  setItem,
  name,
  description,
  className,
  hideDescription,
}: {
  item: ExplorerItem;
  name?: { value: string; color: Color };
  description?: string | null;
  setItem: (t: ExplorerItem) => void;
  className?: string;
  hideDescription?: boolean;
}) {
  if (item == null) return null;

  let child: ReactNode = <>Unknown Type</>;

  if (item.kind === 'type') {
    child = (
      <>
        <div className="font-mono text-editor">
          {name && (
            <span
              className={classNames(
                name?.color === 'danger' && 'text-danger',
                name?.color === 'primary' && 'text-primary',
                name?.color === 'success' && 'text-success',
                name?.color === 'warning' && 'text-warning',
                name?.color === 'notice' && 'text-notice',
                name?.color === 'info' && 'text-info',
              )}
            >
              {name.value}:&nbsp;
            </span>
          )}
          <GqlTypeLink color="notice" item={item} setItem={setItem} />
        </div>
        {!hideDescription && (
          <DocMarkdown>
            {(description === undefined ? getNamedType(item.type).description : description) ??
              null}
          </DocMarkdown>
        )}
      </>
    );
  } else if (item.kind === 'field') {
    const returnItem: ExplorerItem = {
      kind: 'type',
      type: item.type.type,
      from: item.from,
    };
    child = (
      <div>
        <div className="font-mono text-editor">
          <GqlTypeLink color="info" item={item} setItem={setItem}>
            {name?.value}
          </GqlTypeLink>
          {item.type.args.length > 0 && (
            <>
              <span className="text-text-subtle">(</span>
              {item.type.args.map((arg) => (
                <div
                  key={`${arg.type}::${arg.name}`}
                  className={classNames(item.type.args.length == 1 && 'inline-flex')}
                >
                  {item.type.args.length > 1 && <>&nbsp;&nbsp;</>}
                  <span className="text-primary">{arg.name}:</span>&nbsp;
                  <GqlTypeLink
                    color="notice"
                    item={{ kind: 'type', type: arg.type, from: item.from }}
                    setItem={setItem}
                  />
                </div>
              ))}
              <span className="text-text-subtle">)</span>
            </>
          )}
          <span className="text-text-subtle">:</span>{' '}
          <GqlTypeLink color="notice" item={returnItem} setItem={setItem} />
        </div>
        <DocMarkdown className="!text-text-subtle mt-0.5">
          {item.type.description ?? null}
        </DocMarkdown>
      </div>
    );
  } else if (item.kind === 'input_field') {
    child = (
      <>
        <div className="font-mono text-editor">
          {name && <span className="text-primary">{name.value}:</span>}{' '}
          <GqlTypeLink color="notice" item={item} setItem={setItem} />
        </div>
        <DocMarkdown>{item.type.description ?? null}</DocMarkdown>
      </>
    );
  }

  return <div className={classNames(className, 'w-full min-w-0')}>{child}</div>;
}

function GqlTypeLink({
  item,
  setItem,
  color,
  children,
  leftSlot,
  className,
}: {
  item: ExplorerItem;
  color?: Color;
  setItem: (item: ExplorerItem) => void;
  children?: ReactNode;
  leftSlot?: ReactNode;
  className?: string;
}) {
  if (item?.kind === 'type' && isListType(item.type)) {
    return (
      <span className="font-mono text-editor">
        <span className="text-text-subtle">[</span>
        <GqlTypeLink
          item={{ ...item, type: item.type.ofType }}
          setItem={setItem}
          color={color}
          leftSlot={leftSlot}
          children={children}
        />
        <span className="text-text-subtle">]</span>
      </span>
    );
  } else if (item?.kind === 'type' && isNonNullType(item.type)) {
    return (
      <span className="font-mono text-editor">
        <GqlTypeLink
          item={{ ...item, type: item.type.ofType }}
          setItem={setItem}
          color={color}
          leftSlot={leftSlot}
          children={children}
        />
        <span className="text-text-subtle">!</span>
      </span>
    );
  }

  return (
    <button
      className={classNames(
        className,
        'hover:underline text-left mr-auto gap-2 max-w-full',
        'inline-flex items-center',
        'font-mono text-editor _truncate',
        color === 'danger' && 'text-danger',
        color === 'primary' && 'text-primary',
        color === 'success' && 'text-success',
        color === 'warning' && 'text-warning',
        color === 'notice' && 'text-notice',
        color === 'info' && 'text-info',
      )}
      onClick={() => setItem(item)}
    >
      {leftSlot}
      <GqlTypeLabel item={item} children={children} />
    </button>
  );
}

function GqlTypeLabel({ item, children }: { item: ExplorerItem; children?: ReactNode }) {
  let inner;
  if (children) {
    inner = children;
  } else if (item == null) {
    inner = 'Root';
  } else if (item.kind === 'type') {
    inner = getNamedType(item.type).name;
  } else {
    inner = getNamedType(item.type.type).name;
  }

  return <div className="_truncate">{inner}</div>;
}

function Subheading({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <h2 className="font-bold text-lg mt-6 flex items-center">
      <div className="_truncate min-w-0">{children}</div>
      {count && <CountBadge count={count} />}
    </h2>
  );
}

function Heading({ children }: { children: ReactNode }) {
  return <h1 className="font-bold text-2xl _truncate">{children}</h1>;
}

function DocMarkdown({ children, className }: { children: string | null; className?: string }) {
  return (
    <Markdown className={classNames(className, '!text-text-subtle italic')}>{children}</Markdown>
  );
}
