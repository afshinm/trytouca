/**
 * Copyright 2018-2020 Pejman Ghorbanzade. All rights reserved.
 */

#include "regression_test.hpp"
#include "code_under_test.hpp"
#include <boost/filesystem.hpp>
#include <boost/program_options.hpp>
#include <iostream>
#include <thread>
#include <weasel/framework/suites.hpp>
#include <weasel/weasel.hpp>

/**
 *
 */
int main(int argc, char* argv[])
{
    MyWorkflow workflow;
    return weasel::framework::main(argc, argv, workflow);
}

/**
 *
 */
MySuite::MySuite(const std::string& datasetDir)
    : _dir(datasetDir)
{
}

/**
 *
 */
void MySuite::initialize()
{
    for (const auto& it : boost::filesystem::directory_iterator(_dir))
    {
        if (!boost::filesystem::is_regular_file(it.path()))
        {
            continue;
        }
        push(it.path().stem().string());
    }
}

/**
 *
 */
boost::program_options::options_description program_options()
{
    namespace po = boost::program_options;
    po::options_description opts { "" };
    // clang-format off
    opts.add_options()
        ("datasets-dir", po::value<std::string>(), "path to datasets directory")
        ("testsuite-file", po::value<std::string>(), "path to testsuite file")
        ("testsuite-remote", po::value<std::string>()->implicit_value("true"),
            "reuse testcases of baseline\n");
    // clang-format on
    return opts;
}

/**
 *
 */
MyWorkflow::MyWorkflow()
    : weasel::framework::Workflow()
{
}

/**
 *
 */
std::string MyWorkflow::describe_options() const
{
    std::ostringstream oss;
    oss << program_options();
    return oss.str();
}

/**
 *
 */
bool MyWorkflow::parse_options(int argc, char* argv[])
{
    namespace po = boost::program_options;
    const auto& opts = program_options();
    po::variables_map vm;
    po::store(po::command_line_parser(argc, argv).options(opts).allow_unregistered().run(), vm);
    for (const auto& value : vm)
    {
        _options[value.first] = value.second.as<std::string>();
    }
    return true;
}

/**
 *
 */
bool MyWorkflow::validate_options() const
{
    // check that option `datasets-dir` is provided.

    if (!_options.count("datasets-dir"))
    {
        std::cerr << "required configuration option \"datasets-dir\" is missing" << std::endl;
        return false;
    }

    // check that directory pointed by option `datasets-dir` exists.

    const auto& datasetsDir = _options.at("datasets-dir");
    if (!boost::filesystem::is_directory(datasetsDir))
    {
        std::cerr << "datasets directory \"" << datasetsDir << "\" does not exist" << std::endl;
        return false;
    }

    // if option `testsuite-file` is provided, check that it points to a valid
    // file.

    if (_options.count("testsuite-file"))
    {
        const auto& file = _options.at("testsuite-file");
        if (!boost::filesystem::is_regular_file(file))
        {
            std::cerr << "testsuite file \"" << file << "\" does not exist" << std::endl;
            return false;
        }
    }

    return true;
}

/**
 *
 */
std::shared_ptr<weasel::framework::Suite> MyWorkflow::suite() const
{
    // if option `testsuite-file` is specified, use the testcases listed
    // in that file. For this purpose, we use the `FileSuite` helper class
    // that is provided by the Weasel test framework. It expects that the
    // testsuite file has one testcase per line, while skipping empty lines
    // and lines that start with `##`.

    if (_options.count("testsuite-file"))
    {
        return std::make_shared<weasel::framework::FileSuite>(_options.at("testsuite-file"));
    }

    // if option `testsuite-remote` is specified, use the testcases that are
    // part of the version submitted to the weasel platform that is currently
    // the suite baseline. For this purpose, we use the `RemoteSuite` helper
    // class that is provided by the Weasel test framework.

    if (_options.count("testsuite-remote") && _options.at("testsuite-remote") == "true")
    {
        return std::make_shared<weasel::framework::RemoteSuite>(_options);
    }

    // if neither options are provided, use all the profiles that exist in
    // the datasets directory as testcases.

    return std::make_shared<MySuite>(_options.at("datasets-dir"));
}

/**
 *
 */
weasel::framework::Errors MyWorkflow::execute(const weasel::framework::Testcase& testcase) const
{
    boost::filesystem::path caseFile = _options.at("datasets-dir");
    caseFile /= testcase + ".json";
    const auto& wizard = parse_profile(caseFile.string());

    weasel::add_assertion(L"id", wizard.username);
    weasel::add_assertion("name", wizard.fullname);
    weasel::add_result("height", wizard.height);
    weasel::add_result(L"weight", wizard.weight);
    weasel::add_result("birth_date", wizard.dob);

    custom_function_1(wizard);

    std::thread t(custom_function_2, wizard);
    t.join();

    weasel::start_timer("func3");
    custom_function_3(wizard);
    weasel::stop_timer("func3");

    weasel::add_metric("external", 10);

    return {};
}

/**
 *
 */
template <>
struct weasel::convert::Conversion<Date>
{
    std::shared_ptr<types::IType> operator()(const Date& value)
    {
        auto out = std::make_shared<types::Object>("Date");
        out->add("year", value._year);
        out->add("month", value._month);
        out->add("day", value._day);
        return out;
    }
};
